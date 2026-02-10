const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// Créer une instance de DOMPurify avec JSDOM
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Nettoie une chaîne de caractères des tags HTML dangereux
 * @param {string} dirty - Chaîne à nettoyer
 * @returns {string} Chaîne nettoyée
 */
function sanitizeHTML(dirty) {
  if (typeof dirty !== 'string') {
    return dirty;
  }
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // Aucun tag HTML autorisé (uniquement du texte)
    ALLOWED_ATTR: [], // Aucun attribut autorisé
    KEEP_CONTENT: true // Garder le contenu texte
  });
}

/**
 * Middleware Express pour sanitizer les données entrantes
 * Nettoie req.body, req.query et req.params
 */
function sanitizeMiddleware(req, res, next) {
  // Sanitizer req.body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitizer req.query
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitizer req.params
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  
  next();
}

/**
 * Nettoie récursivement un objet
 * @param {object} obj - Objet à nettoyer
 * @returns {object} Objet nettoyé
 */
function sanitizeObject(obj) {
  const cleaned = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        cleaned[key] = sanitizeHTML(value);
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map(item => 
          typeof item === 'string' ? sanitizeHTML(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = sanitizeObject(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
}

module.exports = {
  sanitizeHTML,
  sanitizeMiddleware,
  sanitizeObject
};
