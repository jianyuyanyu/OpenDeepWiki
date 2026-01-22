export interface RepoTreeNode {
  title: string;
  slug: string;
  children: RepoTreeNode[];
}

export interface RepoTreeResponse {
  owner: string;
  repo: string;
  defaultSlug: string;
  nodes: RepoTreeNode[];
}

export interface RepoDocResponse {
  slug: string;
  content: string;
}

export interface RepoHeading {
  id: string;
  text: string;
  level: number;
}
