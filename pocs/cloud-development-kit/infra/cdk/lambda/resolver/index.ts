exports.handler = async (event: any) => {
  console.log("AppSync event", JSON.stringify(event));
  return "Lambda Resolver";
};
