import { Logger } from '@resourvereign/plugin-types/logger.js';
import { PluginSchemaPropertyType } from '@resourvereign/plugin-types/plugin/index.js';
import {
  ScheduleMiddlewareContext,
  SchedulingPlugin,
} from '@resourvereign/plugin-types/plugin/scheduling.js';
import { adjust, parse } from 'compact-relative-time-notation';

const schema = {
  properties: {
    start: {
      type: PluginSchemaPropertyType.string,
    },
  },
};

type StartData = {
  start: string;
};

const initialize = async ({ start }: StartData, logger: Logger) => {
  return {
    validate() {
      logger.debug(`Starting validation`);
      return !!parse(start);
    },
    async scheduleMiddleware(context: ScheduleMiddlewareContext, next: () => Promise<void>) {
      logger.debug(
        `Intent date: ${context.intent.date}, candidate: ${context.date}, start: ${start}`,
      );
      const limit = adjust(context.intent.date, start);
      if (!context.date) {
        logger.debug(`Date is undefined, nothing to do`);
        return await next();
      }
      if (context.date < limit) {
        context.date = limit;
        logger.debug(`Date is before limit: ${limit}, adjusting to ${context.date}`);
      } else {
        logger.debug(`Date is after limit: ${limit}, not adjusting`);
      }
      return await next();
    },
  };
};

export default {
  schema,
  initialize,
} satisfies SchedulingPlugin<StartData>;
