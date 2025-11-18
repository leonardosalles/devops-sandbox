import { Lambda } from 'aws-sdk';

export const handler = async (event: any) => {
  console.log('Task Executor Event:', JSON.stringify(event, null, 2));

  try {
    const taskName = event.taskName || event.arguments?.taskName;
    const parameters = event.parameters || event.arguments?.parameters || {};

    if (!taskName) {
      throw new Error('taskName is required');
    }

    const functionName = process.env.TASK_DEMO_FUNCTION_ARN || '';

    if (!functionName) {
      throw new Error('TASK_DEMO_FUNCTION_ARN environment variable is not set');
    }

    const lambda = new Lambda();

    const response = await lambda
      .invoke({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          taskName,
          parameters,
        }),
      })
      .promise();

    const payload = response.Payload ? JSON.parse(response.Payload.toString()) : {};

    if (response.FunctionError) {
      console.error('Lambda execution error:', payload);
      throw new Error(payload.errorMessage || 'Error executing task');
    }

    const body = payload.body ? JSON.parse(payload.body) : payload;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        ...body,
      }),
    };
  } catch (error: any) {
    console.error('Error in task executor:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        taskName: event.taskName || 'unknown',
        parameters: event.parameters || {},
      }),
    };
  }
};
