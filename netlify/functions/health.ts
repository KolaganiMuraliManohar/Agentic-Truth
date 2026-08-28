export const handler = async () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      status: 'ok',
      engine: 'LangGraph-Netlify-Serverless',
      version: '2.0.0',
      timestamp: Date.now(),
    }),
  };
};
