// Shim for @graphql-typed-document-node/core
// This package is types-only but codegen imports from it
// We provide an empty export to satisfy the import
export interface DocumentTypeDecoration<TResult, TVariables> {
  __apiType?: (variables: TVariables) => TResult;
  __resultType?: TResult;
  __variablesType?: TVariables;
}
