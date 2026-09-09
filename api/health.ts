export default function handler(req: any, res: any) {
  res.status(200).json({
    status: "ok",
    app: "Smart Inventory Management System (DN_ Materials)",
    platform: "Vercel Serverless",
    timestamp: new Date().toISOString()
  });
}
