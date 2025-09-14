import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import sequelize from "./database.js";
import { Orden } from "./models/index.js";

// Initialize SQS client
const sqsClient = new SQSClient({ 
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.SQS_ENDPOINT || 'https://sqs.us-east-1.amazonaws.com',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
  }
});

// Initialize SNS client
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.SNS_ENDPOINT || 'https://sns.us-east-1.amazonaws.com',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
  }
});

const QUEUE_URL = process.env.ORDER_CREATION_QUEUE_URL;

if (!QUEUE_URL) {
  console.error("ORDER_CREATION_QUEUE_URL environment variable is required");
  process.exit(1);
}

console.log(`SQS Worker starting...`);
console.log(`Queue URL: ${QUEUE_URL}`);
console.log(`AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Helper function to publish events to SNS
async function publishEvent(eventType, orderData, additionalData = {}) {
  try {
    const event = {
      eventType,
      orderId: orderData.orderId,
      productoId: orderData.productoId,
      cantidadTotal: orderData.cantidadTotal,
      userId: orderData.userId,
      priority: orderData.priority,
      source: orderData.source,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    await snsClient.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Message: JSON.stringify(event),
      MessageAttributes: {
        eventType: { DataType: "String", StringValue: eventType },
        orderId: { DataType: "String", StringValue: orderData.orderId },
        productoId: { DataType: "String", StringValue: orderData.productoId },
        priority: { DataType: "String", StringValue: orderData.priority }
      }
    }));
    
    console.log(`Event published to SNS: ${eventType} for order ${orderData.orderId}`);
  } catch (error) {
    console.error(`Error publishing ${eventType} event to SNS:`, error);
    // Continue processing even if SNS fails
  }
}

// Process a single order
async function processOrder(orderData) {
  const startTime = Date.now();
  let orden = null;
  
  try {
    const { orderId, cantidadTotal, productoId, userId, priority, source } = orderData;
    
    console.log(`Processing order ${orderId} for product ${productoId}, quantity: ${cantidadTotal}`);

    // Publish order processing started event
    await publishEvent('ORDER_PROCESSING_STARTED', orderData);

    // Validate input
    if (!cantidadTotal || cantidadTotal <= 0) {
      throw new Error("Cantidad total debe ser mayor a 0");
    }
    if (!productoId) {
      throw new Error("productoId es requerido");
    }

    // Get inventarios URL from environment
    const inventariosUrl = process.env.INVENTARIOS_URL || 'http://inventarios:4001';

    // Consultar lotes disponibles para el producto
    const invResp = await fetch(`${inventariosUrl}/inventarios/producto/${productoId}`);
    if (!invResp.ok) {
      const text = await invResp.text();
      throw new Error(`Error consultando inventarios: ${text}`);
    }
    const lotes = await invResp.json();

    // Validar que la cantidad total solicitada sea menor o igual a la cantidad total disponible
    const disponibleTotal = lotes.reduce((acc, l) => acc + (l.cantidadDisponible || 0), 0);
    if (disponibleTotal < cantidadTotal) {
      throw new Error(`Stock insuficiente. Solicitado: ${cantidadTotal}, Disponible: ${disponibleTotal}`);
    }

    // Crear orden pendiente
    orden = await Orden.create({
      id: orderId,
      fecha: new Date(),
      estado: "pendiente",
      cantidadTotal,
      productoId
    });

    // Ordenar lotes por fecha de vencimiento
    lotes.sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

    let restante = cantidadTotal;
    const consumidos = [];

    for (const lote of lotes) {
      if (restante <= 0) break;
      const originalDisponible = Number(lote.cantidadDisponible || 0);
      const consumir = Math.min(restante, originalDisponible);
      if (consumir <= 0) continue;
      const nuevoDisponible = originalDisponible - consumir;

      // Actualizar inventario
      if (nuevoDisponible === 0) {
        const deleteResp = await fetch(`${inventariosUrl}/inventarios/${lote.id}`, {
          method: "DELETE"
        });
        if (!deleteResp.ok) {
          const text = await deleteResp.text();

          // Rollback consumed inventory
          for (const c of consumidos) {
            try {
              if (c.deleted) {
                await fetch(`${inventariosUrl}/inventarios`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    productoId: c.productoId,
                    bodegaId: c.bodegaId,
                    lote: c.lote,
                    cantidadDisponible: c.consumido,
                    fechaVencimiento: c.fechaVencimiento
                  })
                });
              } else {
                await fetch(`${inventariosUrl}/inventarios/${c.inventarioId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ cantidadDisponible: c.restoreCantidad })
                });
              }
            } catch (_) {}
          }
          
          orden.estado = "fallida";
          await orden.save();
          throw new Error(`Error eliminando inventario: ${text}`);
        }
        consumidos.push({ 
          inventarioId: lote.id, 
          lote: lote.lote, 
          cantidadAsignada: consumir, 
          fechaVencimiento: lote.fechaVencimiento, 
          cantidadInicialDisponible: originalDisponible,
          deleted: true,
          productoId: lote.ProductoId,
          bodegaId: lote.BodegaId,
          consumido: consumir,
          restoreCantidad: originalDisponible
        });
      } else {
        // Actualizar cantidad disponible
        const patchResp = await fetch(`${inventariosUrl}/inventarios/${lote.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cantidadDisponible: nuevoDisponible })
        });
        if (!patchResp.ok) {
          const text = await patchResp.text();

          // Rollback consumed inventory
          for (const c of consumidos) {
            try {
              if (c.deleted) {
                await fetch(`${inventariosUrl}/inventarios`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    productoId: c.productoId,
                    bodegaId: c.bodegaId,
                    lote: c.lote,
                    cantidadDisponible: c.consumido,
                    fechaVencimiento: c.fechaVencimiento
                  })
                });
              } else {
                await fetch(`${inventariosUrl}/inventarios/${c.inventarioId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ cantidadDisponible: c.restoreCantidad })
                });
              }
            } catch (_) {}
          }
          
          orden.estado = "fallida";
          await orden.save();
          throw new Error(`Error actualizando inventario: ${text}`);
        }
        consumidos.push({ 
          inventarioId: lote.id, 
          lote: lote.lote, 
          cantidadAsignada: consumir, 
          fechaVencimiento: lote.fechaVencimiento, 
          cantidadInicialDisponible: originalDisponible,
          deleted: false,
          restoreCantidad: originalDisponible
        });
      }
      restante -= consumir;
    }

    // Asegurar que se haya asignado toda la cantidad
    if (restante > 0) {
      // Rollback all consumed inventory
      for (const c of consumidos) {
        try {
          if (c.deleted) {
            await fetch(`${inventariosUrl}/inventarios`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productoId: c.productoId,
                bodegaId: c.bodegaId,
                lote: c.lote,
                cantidadDisponible: c.consumido,
                fechaVencimiento: c.fechaVencimiento
              })
            });
          } else {
            await fetch(`${inventariosUrl}/inventarios/${c.inventarioId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cantidadDisponible: c.restoreCantidad })
            });
          }
        } catch (_) {}
      }
      
      orden.estado = "fallida";
      await orden.save();
      throw new Error("Fallo de asignación parcial");
    }

    // Marcar orden como creada
    orden.estado = "creada";
    await orden.save();

    const processingTime = Date.now() - startTime;
    console.log(`Order ${orderId} processed successfully in ${processingTime}ms`);

    // Publish order completed event
    await publishEvent('ORDER_COMPLETED', orderData, {
      processingTime,
      asignacion: consumidos
    });

    return { orden, asignacion: consumidos };
  } catch (error) {
    console.error(`Error processing order ${orderData.orderId}:`, error.message);
    
    // Publish order failed event
    await publishEvent('ORDER_FAILED', orderData, {
      error: error.message,
      processingTime: Date.now() - startTime
    });
    
    throw error;
  }
}

// Poll for messages
async function pollMessages() {
  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20, // Long polling
      VisibilityTimeoutSeconds: 30
    });

    const response = await sqsClient.send(command);
    
    if (response.Messages && response.Messages.length > 0) {
      console.log(`Received ${response.Messages.length} messages`);
      
      for (const message of response.Messages) {
        try {
          const orderData = JSON.parse(message.Body);
          await processOrder(orderData);
          
          // Delete message after successful processing
          await sqsClient.send(new DeleteMessageCommand({
            QueueUrl: QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle
          }));
          
          console.log(`Message ${message.MessageId} processed and deleted`);
        } catch (error) {
          console.error(`Error processing message ${message.MessageId}:`, error.message);
          // Message will be retried by SQS after visibility timeout
        }
      }
    }
  } catch (error) {
    console.error("Error polling messages:", error.message);
  }
}

// Start polling
async function startWorker() {
  console.log("Starting SQS worker...");
  
  // Initialize database
  await sequelize.sync({ force: true });
  console.log("Database synchronized");
  
  // Start polling loop
  setInterval(pollMessages, 1000); // Poll every second
  
  console.log("SQS worker started and polling for messages");
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down SQS worker...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down SQS worker...');
  process.exit(0);
});

// Start the worker
startWorker().catch(console.error);
