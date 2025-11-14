import { ApolloClient, InMemoryCache, gql } from "@apollo/client";

export default function Home({ data }) {
  return (
    <div style={{ padding: 20 }}>
      GraphQL response: {data?.hello ?? "no-data"}
    </div>
  );
}

export async function getServerSideProps() {
  const client = new ApolloClient({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
    cache: new InMemoryCache(),
  });

  try {
    const { data } = await client.query({
      query: gql`
        query {
          hello
        }
      `,
    });
    return { props: { data } };
  } catch (e) {
    return { props: { data: null } };
  }
}
