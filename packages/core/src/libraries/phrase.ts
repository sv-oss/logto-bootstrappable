import type { LocalePhrase } from '@logto/phrases-experience';
import resource, { isBuiltInLanguageTag } from '@logto/phrases-experience';
import { trySafe } from '@silverhand/essentials';
import cleanDeep from 'clean-deep';
import deepmerge from 'deepmerge';

import type Queries from '#src/tenants/Queries.js';

export const createPhraseLibrary = (queries: Queries) => {
  const { findCustomPhraseByLanguageTag, findAllCustomLanguageTags } = queries.customPhrases;

  const getPhrases = async (forLanguage: string): Promise<LocalePhrase> => {
    const builtInPhrase = resource[isBuiltInLanguageTag(forLanguage) ? forLanguage : 'en'];

    return deepmerge<LocalePhrase>(
      resource.en,
      deepmerge(
        cleanDeep(builtInPhrase),
        cleanDeep((await trySafe(findCustomPhraseByLanguageTag(forLanguage))) ?? {})
      )
    );
  };

  return {
    getPhrases,
    findAllCustomLanguageTags,
  };
};
