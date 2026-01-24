export interface MyContext {
  token?: string;
  userId?: string;
  supabaseUserId?: string;
}

export { API_ROUTES, API_BASE_PATH } from './routes.js';
export {
  getEmailHtmlCss,
  wrapEmailHtml,
  wrapReplyContent,
  type EmailHtmlStyleOptions,
} from './emailHtmlStyles.js';
