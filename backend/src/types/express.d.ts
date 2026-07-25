import type { Role } from '../contracts';
import type { UserDoc, SessionDoc } from '../models';
import type { OrgContext } from '../rbac/access';

/** Auth context attached by the `authenticate` middleware. */
export interface AuthContext {
  userId: string;
  role: Role;
  sessionId: string;
  user: UserDoc;
  session: SessionDoc;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
      org?: OrgContext;
    }
  }
}

export {};
