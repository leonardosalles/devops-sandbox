import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import fs from "fs";
import path from "path";

const typeDefs = fs.readFileSync(
  path.join(__dirname, "../schema.graphql"),
  "utf8"
);

const resolvers = {
  Query: {
    hello: async () => {
      const lambda = require("../../lambda-local/src/index");

      return lambda.handler({ fieldName: "hello" });
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

async function start() {
  const app = express();
  const server = new ApolloServer({ schema });

  await server.start();

  app.use("/graphql", express.json(), expressMiddleware(server));

  app.listen(20002, () =>
    console.log("Mock AppSync running at http://localhost:20002/graphql")
  );
}

start();
