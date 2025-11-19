import { Stack, StackProps, aws_ecr as ecr } from "aws-cdk-lib";
import { Construct } from "constructs";

export class EcrStack extends Stack {
  public readonly repo: ecr.IRepository;

  constructor(
    scope: Construct,
    id: string,
    props?: { repoName?: string } & StackProps
  ) {
    super(scope, id, props);

    const name = props?.repoName || "cs2-server";

    try {
      this.repo = ecr.Repository.fromRepositoryName(
        this,
        "Cs2RepoImported",
        name
      );
    } catch {
      this.repo = new ecr.Repository(this, "Cs2RepoNew", {
        repositoryName: name,
      });
    }
  }
}
