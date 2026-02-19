import dedent from '@libs/StringUtils/dedent';
import Glossary from './Glossary';

const spanishGlossary = new Glossary([
    // Branded product names
    {sourceTerm: 'Expensify Card', targetTerm: 'Tarjeta Expensify', usage: 'Branded Expensify payment card'},
]);

export default dedent(`
    When translating to Spanish, follow these rules:

    - Use informal "tú" for user-facing text to match the existing tone of the app.
    - Keep UI labels concise and follow standard Spanish capitalization rules.
    - Use standard Latin American Spanish conventions unless otherwise specified.

    Use the following glossary for canonical Spanish translations of common terms:

    ${spanishGlossary.toXML()}
`);
