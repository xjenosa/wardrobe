const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const colour = 'A colour comes from src/theme/tokens.ts (docs/Acceptance.md).';
const words = 'Words a person reads come from src/strings/ (docs/Acceptance.md).';
const typeface = 'A typeface comes from src/theme/font.ts (docs/Acceptance.md).';
const labelled =
  '/^(title|label|placeholder|aria-label|accessibilityLabel|accessibilityHint|tabBarLabel|headerTitle|headerBackTitle)$/';
const coloured = '/(^c|C)olor$/';

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'docs/*', '.expo/*'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**', 'src/strings/**', 'src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: 'Literal[value=/^\\s*(#[0-9a-fA-F]{3,8}|rgba?\\(|hsla?\\()/]', message: colour },
        { selector: `Property[key.name=${coloured}] > Literal`, message: colour },
        { selector: `JSXAttribute[name.name=${coloured}] > Literal`, message: colour },
        { selector: 'Property[key.name="fontFamily"] > Literal', message: typeface },
        { selector: 'Property[key.name="fontFamily"] > TemplateLiteral', message: typeface },
        { selector: 'JSXText[value=/\\S/]', message: words },
        { selector: 'JSXExpressionContainer > Literal[value=/\\S/]', message: words },
        { selector: 'JSXExpressionContainer > TemplateLiteral', message: words },
        { selector: `JSXAttribute[name.name=${labelled}] > Literal`, message: words },
        { selector: `Property[key.name=${labelled}] > Literal`, message: words },
        { selector: "CallExpression[callee.object.name='Alert'] > Literal", message: words },
        { selector: "CallExpression[callee.object.name='Alert'] > TemplateLiteral", message: words },
      ],
    },
  },
]);
