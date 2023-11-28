import { Logger } from '@resourvereign/plugin-types/logger.js';
import { PluginSchemaPropertyType } from '@resourvereign/plugin-types/plugin/index.js';
import {
  ScheduleMiddlewareContext,
  SchedulingPlugin,
  SchedulingReason,
} from '@resourvereign/plugin-types/plugin/scheduling.js';
import { adjust, parse } from 'compact-relative-time-notation';

const schema = {
  properties: {
    relativeTimeFromIntent: {
      type: PluginSchemaPropertyType.string,
    },
  },
};

type StartData = {
  relativeTimeFromIntent: string;
};

const initialize = async ({ relativeTimeFromIntent }: StartData, logger: Logger) => {
  return {
    validate() {
      logger.debug(`Starting validation`);
      return !!parse(relativeTimeFromIntent);
    },
    async scheduleMiddleware(context: ScheduleMiddlewareContext, next: () => Promise<void>) {
      logger.debug(
        `Intent date: ${context.intent.date}, candidate: ${context.date}, reason: ${context.reason}, relativeTimeFromIntent: ${relativeTimeFromIntent}`,
      );
      if (context.reason !== SchedulingReason.intentCreation) {
        logger.debug(`Reason is not intent creation, nothing to do`);
        return await next();
      }
      if (!context.date) {
        logger.debug(`Date is undefined, nothing to do`);
        return await next();
      }

      const limit = adjust(context.intent.date, relativeTimeFromIntent);
      if (context.date < limit) {
        context.date = limit;
        logger.debug(
          `Candidate date ${context.date} is before limit ${limit}, adjusting to ${context.date}`,
        );
      } else {
        logger.debug(`Candidate date ${context.date} is after limit ${limit}, not adjusting`);
      }
      return await next();
    },
  };
};

export default {
  schema,
  initialize,
} satisfies SchedulingPlugin<StartData>;
