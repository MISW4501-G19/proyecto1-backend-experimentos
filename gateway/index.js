import express from "express";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

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

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    res.status(200).json({ 
      status: "healthy", 
      service: "gateway",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({ 
      status: "unhealthy", 
      service: "gateway",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Order creation endpoint - publishes to SNS and sends to SQS
app.post("/ordenes", async (req, res) => {
  try {
    const { cantidadTotal, productoId, userId, priority, source } = req.body;

    // Validate input
    if (!cantidadTotal || cantidadTotal <= 0) {
      return res.status(400).json({ error: "Cantidad total debe ser mayor a 0" });
    }
    if (!productoId) {
      return res.status(400).json({ error: "productoId es requerido" });
    }

    // Generate order ID
    const ordenId = uuidv4();

    // Create order data
    const orderData = {
      orderId: ordenId,
      productoId,
      cantidadTotal,
      userId: userId || 'anonymous',
      priority: priority || 'normal',
      source: source || 'api',
      timestamp: new Date().toISOString()
    };

    // Publish order created event to SNS
    try {
      await snsClient.send(new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: JSON.stringify({
          eventType: 'ORDER_CREATED',
          orderId: ordenId,
          productoId,
          cantidadTotal,
          userId: orderData.userId,
          priority: orderData.priority,
          source: orderData.source,
          timestamp: orderData.timestamp
        }),
        MessageAttributes: {
          eventType: { DataType: "String", StringValue: "ORDER_CREATED" },
          orderId: { DataType: "String", StringValue: ordenId },
          productoId: { DataType: "String", StringValue: productoId },
          priority: { DataType: "String", StringValue: orderData.priority }
        }
      }));
      console.log(`Order created event published to SNS: ${ordenId}`);
    } catch (snsError) {
      console.error("Error publishing to SNS:", snsError);
      // Continue processing even if SNS fails
    }

    // Send message to SQS for processing
    const sqsMessage = {
      orderId: ordenId,
      productoId,
      cantidadTotal,
      userId: orderData.userId,
      priority: orderData.priority,
      source: orderData.source,
      timestamp: orderData.timestamp
    };

    await sqsClient.send(new SendMessageCommand({
      QueueUrl: process.env.ORDER_CREATION_QUEUE_URL,
      MessageBody: JSON.stringify(sqsMessage),
      MessageAttributes: {
        orderId: { DataType: "String", StringValue: ordenId },
        productoId: { DataType: "String", StringValue: productoId },
        priority: { DataType: "String", StringValue: orderData.priority },
        source: { DataType: "String", StringValue: orderData.source }
      }
    }));

    // Return immediately with order ID
    res.status(202).json({ 
      ordenId,
      status: "queued",
      message: "Order queued for processing",
      timestamp: orderData.timestamp,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy other order endpoints to Órdenes service
app.get("/ordenes", async (req, res) => {
  try {
    const ordenesUrl = process.env.ORDENES_URL || 'http://ordenes:4002';
    const response = await fetch(`${ordenesUrl}/ordenes`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/ordenes/:id/status", async (req, res) => {
  try {
    const ordenesUrl = process.env.ORDENES_URL || 'http://ordenes:4002';
    const response = await fetch(`${ordenesUrl}/ordenes/${req.params.id}/status`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Custom proxy for inventarios endpoints using fetch
app.all("/inventarios/*", async (req, res) => {
  try {
    const inventariosUrl = process.env.INVENTARIOS_URL || 'http://inventarios:4001';
    const targetPath = req.path.replace('/inventarios', '');
    const targetUrl = `${inventariosUrl}${targetPath}`;
    
    console.log(`Proxying ${req.method} ${req.path} to ${targetUrl}`);
    
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    };
    
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = JSON.stringify(req.body);
    }
    
    const response = await fetch(targetUrl, options);
    const data = await response.text();
    
    console.log(`Proxy response: ${response.status} for ${req.method} ${req.path}`);
    
    res.status(response.status).json(JSON.parse(data));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(502).json({ error: 'Service temporarily unavailable' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Gateway corriendo en puerto ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Inventarios URL: ${process.env.INVENTARIOS_URL || 'http://inventarios:4001'}`);
  console.log(`Ordenes URL: ${process.env.ORDENES_URL || 'http://ordenes:4002'}`);
  console.log(`SQS Queue: ${process.env.ORDER_CREATION_QUEUE_URL}`);
  console.log(`SNS Topic: ${process.env.SNS_TOPIC_ARN}`);
});
