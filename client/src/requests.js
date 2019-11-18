
import { getAccessToken, isLoggedIn} from './auth'
import { ApolloClient, HttpLink, InMemoryCache, ApolloLink} from 'apollo-boost'
import gql from 'graphql-tag';
const url = "http://localhost:9000/graphql1";
const authLink = new ApolloLink ((operation, forward) => {
  if (isLoggedIn){
     operation.setContext({
        headers: {
          'authorization': 'Bearer ' + getAccessToken()
        }
       }
     );
  }
    return forward(operation);
  }
);
const client = new ApolloClient({
  link: ApolloLink.from([
    authLink,
    new HttpLink({uri: url})
  ]),
  cache: new InMemoryCache()
});

const jobDetailFragment = gql`
    fragment jobDetail on Job{
      id
        title
        company {
          id
          name
        }
    }
`;
const  jobQuery = gql`
      query jobQuery ($id: ID!){
        job(id: $id){
          ...jobDetail
          description
        }
      }
      ${jobDetailFragment}
`;
const jobsQuery = gql`{
      jobs {
        ...jobDetail
    }
}
${jobDetailFragment}
`;

export async function loadJob(id) {
    
    const {data: {job}} = await client.query ({query: jobQuery, variables: {id}});
    return job;

}
export async function loadJobs() {
  const {data: {jobs}} = await client.query({query: jobsQuery, fetchPolicy: "no-cache"});
  return jobs;

}
export async function loadCompany(id) {
  const query = gql` 
        query companyQuery($id: ID!){
        company (id: $id){
        id
        name
        description
        jobs {
          id
          title
        }
        
      }
    }
  `
  const { data: {company} } =  await client.query({query,variables: {id}});
  return company;
  
}
export async function createJob(input) {
  const mutation = gql`
        mutation createJob($input: createJobInput) {
          job: createJob (
            input: $input
          ){
            id
            title
            company {
              id
              name
            }
          }
        }
    `;
  const {data: {job}}  = await client.mutate(
    { mutation, 
      variables: {input},
      update: (cache, {data}) =>{
        const p = {query: jobQuery, variables: {id: data.job.id}, data};
        cache.writeQuery(p);
      }
    }
    );
  return job;
}
