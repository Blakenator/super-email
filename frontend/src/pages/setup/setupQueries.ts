import { gql } from '../../__generated__/gql';

export const COMPLETE_SETUP_WIZARD_MUTATION = gql(`
  mutation CompleteSetupWizard {
    completeSetupWizard {
      id
      setupWizardCompletedAt
    }
  }
`);
