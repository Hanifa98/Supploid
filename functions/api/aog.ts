import { handle, type Context } from '../../server/handler';
export const onRequest=(context:Context)=>handle(context,'aog');
