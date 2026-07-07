const TEMPLATE_REGEX = /\{\{([^}]*)\}\}/g;

function getNestedValue(source: object, path: string) {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return '';
  }, source);
}

export function renderTemplate(template: string, data: object) {
  if (!template) {
    return '';
  }

  return template.replace(TEMPLATE_REGEX, (_, key: string) => {
    const value = getNestedValue(data, key.trim());
    return value == null ? '' : String(value);
  });
}
