import { APIGatewayProxyEvent } from "aws-lambda";

interface CustomEvent extends APIGatewayProxyEvent {
  fieldName: string;
}

export async function handler(event: CustomEvent) {
  console.log("Lambda local invocation", event);

  if (event.fieldName === "hello") {
    return "Hello from Lambda (local)";
  }

  return null;
}
