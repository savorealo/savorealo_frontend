// DOCUMENTACION AUTOMATIZADA 

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function getConceptSpanish(concept) {
  concept = concept.toLowerCase();
  const translations = {
    'auth': 'la autenticación',
    'feed': 'el feed de publicaciones',
    'places': 'los lugares gastronómicos',
    'place': 'un lugar gastronómico',
    'messages': 'los mensajes del chat',
    'message': 'un mensaje de chat',
    'notifications': 'las notificaciones',
    'notification': 'una notificación',
    'profile': 'el perfil del chef',
    'saved': 'las recetas guardadas',
    'shopping': 'la lista de la compra',
    'shopping-list': 'la lista de la compra',
    'theme': 'el tema visual (claro/oscuro)',
    'user': 'el usuario o chef',
    'comment': 'un comentario',
    'comments': 'los comentarios',
    'report': 'un reporte de contenido',
    'reports': 'los reportes de contenido',
    'search': 'las búsquedas globales',
    'story': 'una historia (story)',
    'stories': 'las historias (stories)',
    'call': 'las llamadas de voz/video',
    'ai': 'la generación de recetas por IA',
    'ai-recipe': 'la receta generada por IA',
    'ai-recipes': 'la generación de recetas por IA',
    'cooking': 'el modo cocina',
    'cooking-mode': 'el modo cocina interactivo',
    'emoji': 'el efecto de lluvia de emojis',
    'emoji-rain': 'el efecto de lluvia de emojis',
    'app': 'la aplicación',
    'shell': 'el diseño general de navegación',
    'nav': 'la navegación',
    'item': 'un elemento',
    'items': 'los elementos',
    'avatar': 'la foto de perfil',
    'button': 'un botón interactivo',
    'spinner': 'un indicador de carga',
    'loader': 'un indicador de carga',
    'skeleton': 'un indicador de carga de tipo esqueleto',
    'dialog': 'un cuadro de diálogo',
    'modal': 'una ventana modal',
    'form': 'un formulario',
    'result': 'los resultados',
    'detail': 'el detalle de un elemento',
    'list': 'la lista de elementos',
    'card': 'la tarjeta informativa',
    'toast': 'los mensajes de notificación flotantes',
    'theme-service': 'el tema visual de la aplicación',
    'presence': 'la presencia en línea de los usuarios'
  };
  return translations[concept] || concept;
}

function translateCamelCase(name) {
  // Replace underscores and split by capital letters
  let clean = name.replace(/_/g, ' ');
  let words = clean.replace(/([A-Z])/g, ' $1').trim().toLowerCase().split(/\s+/);
  
  const translations = {
    'load': 'cargar',
    'save': 'guardar',
    'delete': 'eliminar',
    'remove': 'eliminar',
    'update': 'actualizar',
    'create': 'crear',
    'send': 'enviar',
    'toggle': 'alternar',
    'get': 'obtener',
    'set': 'establecer',
    'clear': 'limpiar',
    'reset': 'reiniciar',
    'open': 'abrir',
    'close': 'cerrar',
    'submit': 'enviar',
    'handle': 'gestionar',
    'on': 'evento de',
    'error': 'error',
    'success': 'éxito',
    'loading': 'cargando',
    'state': 'estado',
    'data': 'datos',
    'view': 'ver',
    'show': 'mostrar',
    'hide': 'ocultar',
    'add': 'añadir',
    'change': 'cambiar',
    'select': 'seleccionar',
    'search': 'buscar',
    'filter': 'filtrar',
    'list': 'lista',
    'cancel': 'cancelar',
    'confirm': 'confirmar',
    'is': 'es o está',
    'has': 'tiene',
    'should': 'debería',
    'can': 'puede',
    'all': 'todos',
    'mine': 'mis',
    'my': 'mi',
    'me': 'yo',
    'by': 'por',
    'id': 'identificador',
    'name': 'nombre',
    'title': 'título',
    'description': 'descripción',
    'image': 'imagen',
    'photo': 'foto',
    'url': 'enlace',
    'link': 'enlace',
    'email': 'correo',
    'password': 'contraseña',
    'username': 'nombre de usuario',
    'avatar': 'avatar',
    'bio': 'biografía',
    'location': 'ubicación',
    'date': 'fecha',
    'time': 'tiempo',
    'duration': 'duración',
    'count': 'cantidad',
    'size': 'tamaño',
    'width': 'ancho',
    'height': 'alto',
    'key': 'clave',
    'value': 'valor',
    'token': 'token',
    'expiry': 'expiración',
    'margin': 'margen',
    'in': 'en',
    'flight': 'vuelo/curso',
    'refresh': 'refrescar'
  };

  words = words.map(w => translations[w] || w);
  return words.join(' ');
}

function getSpanishDescription(name, type) {
  let cleanName = name.trim();
  
  if (cleanName === 'config') return 'Configuración de entorno para el servidor de renderizado.';
  if (cleanName === 'serverConfig') return 'Configuración del servidor de Angular SSR.';
  if (cleanName === 'appConfig') return 'Configuración del proveedor de servicios global de la aplicación Angular.';
  if (cleanName === 'serverRoutes') return 'Definición de las rutas del lado del servidor de Angular SSR.';
  if (cleanName === 'routes') return 'Definición de las rutas de navegación del lado del cliente.';
  if (cleanName === 'App') return 'Componente principal que actúa como contenedor raíz de toda la aplicación.';
  
  if (cleanName.endsWith('Store')) {
    const concept = cleanName.replace('Store', '');
    return `Almacén de estado reactivo para gestionar la lógica de ${getConceptSpanish(concept)}.`;
  }
  if (cleanName.endsWith('Service')) {
    const concept = cleanName.replace('Service', '');
    return `Servicio que provee la lógica de negocio para ${getConceptSpanish(concept)}.`;
  }
  if (cleanName.endsWith('Repository')) {
    const concept = cleanName.replace('Repository', '');
    return `Repositorio de datos para ${getConceptSpanish(concept)}.`;
  }
  if (cleanName.startsWith('I') && cleanName.endsWith('Repository')) {
    const concept = cleanName.substring(1).replace('Repository', '');
    return `Interfaz que define el contrato del repositorio de ${getConceptSpanish(concept)}.`;
  }
  if (cleanName.endsWith('Component') || cleanName.endsWith('Page')) {
    const concept = cleanName.replace('Component', '').replace('Page', '');
    return `Componente principal para la vista o página de ${getConceptSpanish(concept)}.`;
  }
  if (cleanName.endsWith('Directive')) {
    const concept = cleanName.replace('Directive', '');
    return `Directiva para controlar el comportamiento de ${getConceptSpanish(concept)}.`;
  }
  if (cleanName.endsWith('Pipe')) {
    const concept = cleanName.replace('Pipe', '');
    return `Pipe personalizado para procesar y mostrar ${getConceptSpanish(concept)} en las plantillas.`;
  }
  if (cleanName.endsWith('Guard')) {
    const concept = cleanName.replace('Guard', '');
    return `Guardia de seguridad (guard) para controlar el acceso a la sección de ${getConceptSpanish(concept)}.`;
  }
  if (cleanName.endsWith('Interceptor')) {
    const concept = cleanName.replace('Interceptor', '');
    return `Interceptor de red para procesar las peticiones relacionadas con ${getConceptSpanish(concept)}.`;
  }
  if (cleanName.endsWith('Dto') || cleanName.endsWith('DTO')) {
    const concept = cleanName.replace('Dto', '').replace('DTO', '');
    return `Objeto de transferencia de datos (DTO) para representar la estructura de ${getConceptSpanish(concept)}.`;
  }
  if (cleanName.startsWith('I') && cleanName[1] && cleanName[1] === cleanName[1].toUpperCase()) {
    const concept = cleanName.substring(1);
    return `Interfaz que representa la estructura de ${getConceptSpanish(concept)}.`;
  }

  if (cleanName.startsWith('map') && cleanName.includes('To')) {
    return `Función de utilidad para mapear y transformar datos.`;
  }

  if (cleanName.toUpperCase() === cleanName) {
    if (cleanName.endsWith('_QUERY')) {
      return `Consulta GraphQL para obtener datos.`;
    }
    if (cleanName.endsWith('_MUTATION')) {
      return `Mutación GraphQL para modificar datos.`;
    }
    if (cleanName.endsWith('_FRAGMENT')) {
      return `Fragmento GraphQL para reutilizar campos.`;
    }
  }

  switch(type) {
    case 'interface':
      return `Interfaz que define la estructura o contrato de datos para ${getConceptSpanish(cleanName)}.`;
    case 'type alias':
      return `Tipo de dato personalizado para ${getConceptSpanish(cleanName)}.`;
    case 'variable':
      return `Variable o constante para ${translateCamelCase(cleanName)}.`;
    case 'function':
      return `Función de utilidad para ${translateCamelCase(cleanName)}.`;
    case 'component':
      return `Componente de interfaz de usuario para ${getConceptSpanish(cleanName)}.`;
    case 'injectable':
      return `Servicio inyectable para ${getConceptSpanish(cleanName)}.`;
    case 'class':
      return `Clase de utilidad para ${getConceptSpanish(cleanName)}.`;
    default:
      return `Definición para ${translateCamelCase(cleanName)}.`;
  }
}

function getMemberDescription(name, kind) {
  const cleanName = name.replace(/['"]/g, '');
  if (kind === 'constructor') {
    return 'Constructor de la clase o componente para inicializar dependencias.';
  }
  
  if (cleanName === 'ngOnInit') return 'Método de ciclo de vida de Angular que se ejecuta al inicializar el componente.';
  if (cleanName === 'ngOnDestroy') return 'Método de ciclo de vida de Angular que se ejecuta al destruir el componente para liberar recursos.';
  if (cleanName === 'ngOnChanges') return 'Método de ciclo de vida de Angular que responde a cambios en las propiedades de entrada.';
  
  if (kind === 'method') {
    return `Método para ${translateCamelCase(cleanName)}.`;
  }
  
  if (cleanName.startsWith('is') || cleanName.startsWith('has') || cleanName.startsWith('should') || cleanName.startsWith('can')) {
    return `Indicador booleano para ${translateCamelCase(cleanName)}.`;
  }
  return `Propiedad para gestionar ${translateCamelCase(cleanName)}.`;
}

function hasJSDoc(node, sourceFile) {
  if (node.jsDoc && node.jsDoc.length > 0) return true;
  
  let start = node.getStart(sourceFile, false);
  if (node.decorators && node.decorators.length > 0) {
    start = Math.min(start, node.decorators[0].getStart(sourceFile, false));
  }
  if (node.modifiers && node.modifiers.length > 0) {
    start = Math.min(start, node.modifiers[0].getStart(sourceFile, false));
  }
  
  const text = sourceFile.text;
  const pos = node.pos;
  const comments = ts.getLeadingCommentRanges(text, pos);
  if (comments && comments.length > 0) {
    for (const comment of comments) {
      const commentText = text.substring(comment.pos, comment.end);
      if (commentText.startsWith('/**')) {
        return true;
      }
    }
  }
  return false;
}

function getInsertPos(node, sourceFile) {
  let start = node.getStart(sourceFile, false);
  if (node.decorators && node.decorators.length > 0) {
    start = Math.min(start, node.decorators[0].getStart(sourceFile, false));
  }
  if (node.modifiers && node.modifiers.length > 0) {
    start = Math.min(start, node.modifiers[0].getStart(sourceFile, false));
  }
  return start;
}

function getIndentation(text, pos) {
  let lineStart = pos;
  while (lineStart > 0 && text[lineStart - 1] !== '\n' && text[lineStart - 1] !== '\r') {
    lineStart--;
  }
  const lineText = text.substring(lineStart, pos);
  const match = lineText.match(/^\s*/);
  return match ? match[0] : '';
}

function walkFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'docs') {
        walkFiles(fullPath, files);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function isExported(node) {
  if (!node.modifiers) return false;
  return node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
}

function processFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  let code = fs.readFileSync(filePath, 'utf8');
  let sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);
  
  const insertions = [];
  const insertedPositions = new Set();

  function addInsertion(node, description) {
    const pos = getInsertPos(node, sourceFile);
    if (insertedPositions.has(pos)) return;
    insertedPositions.add(pos);

    const indent = getIndentation(sourceFile.text, pos);
    const jsdoc = `/**\n${indent} * ${description}\n${indent} */\n${indent}`;
    insertions.push({ pos, text: jsdoc });
  }

  function checkNode(node, insideClass = false, insideInterface = false) {
    // 1. Top level declarations
    if (!insideClass && !insideInterface) {
      if (ts.isClassDeclaration(node)) {
        if (!hasJSDoc(node, sourceFile)) {
          let type = 'class';
          if (node.decorators) {
            for (const dec of node.decorators) {
              const text = dec.getText(sourceFile);
              if (text.includes('Component')) type = 'component';
              else if (text.includes('Injectable')) type = 'injectable';
              else if (text.includes('Pipe')) type = 'pipe';
              else if (text.includes('Directive')) type = 'directive';
            }
          }
          const name = node.name ? node.name.text : 'Componente';
          addInsertion(node, getSpanishDescription(name, type));
        }
        // Traverse class members
        node.forEachChild(child => checkNode(child, true, false));
        return;
      }
      
      if (ts.isInterfaceDeclaration(node)) {
        if (!hasJSDoc(node, sourceFile)) {
          const name = node.name.text;
          addInsertion(node, getSpanishDescription(name, 'interface'));
        }
        // Traverse interface members
        node.forEachChild(child => checkNode(child, false, true));
        return;
      }

      if (ts.isTypeAliasDeclaration(node)) {
        if (!hasJSDoc(node, sourceFile)) {
          const name = node.name.text;
          addInsertion(node, getSpanishDescription(name, 'type alias'));
        }
        return;
      }

      if (ts.isFunctionDeclaration(node)) {
        if (!hasJSDoc(node, sourceFile)) {
          const name = node.name ? node.name.text : 'funcion';
          addInsertion(node, getSpanishDescription(name, 'function'));
        }
        return;
      }

      if (ts.isVariableStatement(node)) {
        // Find if any declaration has no JSDoc
        const declarations = node.declarationList.declarations;
        for (const decl of declarations) {
          if (!hasJSDoc(node, sourceFile)) {
            const name = decl.name.getText(sourceFile);
            addInsertion(node, getSpanishDescription(name, 'variable'));
            break;
          }
        }
        return;
      }
      
      if (ts.isEnumDeclaration(node)) {
        if (!hasJSDoc(node, sourceFile)) {
          const name = node.name.text;
          addInsertion(node, getSpanishDescription(name, 'enum'));
        }
        return;
      }
    }

    // 2. Class members (methods, properties, constructor)
    if (insideClass) {
      if (ts.isMethodDeclaration(node) || ts.isPropertyDeclaration(node) || ts.isConstructorDeclaration(node) || ts.isGetAccessor(node) || ts.isSetAccessor(node)) {
        if (!hasJSDoc(node, sourceFile)) {
          let kind = 'property';
          if (ts.isMethodDeclaration(node) || ts.isGetAccessor(node) || ts.isSetAccessor(node)) kind = 'method';
          else if (ts.isConstructorDeclaration(node)) kind = 'constructor';
          
          const name = node.name ? node.name.getText(sourceFile) : 'constructor';
          addInsertion(node, getMemberDescription(name, kind));
        }
      }
    }

    // 3. Interface members
    if (insideInterface) {
      if (ts.isPropertySignature(node) || ts.isMethodSignature(node)) {
        if (!hasJSDoc(node, sourceFile)) {
          let kind = ts.isMethodSignature(node) ? 'method' : 'property';
          const name = node.name.getText(sourceFile);
          addInsertion(node, getMemberDescription(name, kind));
        }
      }
    }

    // Continue traversing unless handled
    node.forEachChild(child => checkNode(child, insideClass, insideInterface));
  }

  // Run traverser
  sourceFile.forEachChild(node => checkNode(node));

  if (insertions.length > 0) {
    // Sort descending by position
    insertions.sort((a, b) => b.pos - a.pos);
    
    let newCode = code;
    for (const inst of insertions) {
      newCode = newCode.slice(0, inst.pos) + inst.text + newCode.slice(inst.pos);
    }
    
    fs.writeFileSync(filePath, newCode, 'utf8');
    console.log(`[UPDATED] ${relativePath} - Added ${insertions.length} JSDoc comments.`);
    return insertions.length;
  }
  return 0;
}

// Walk all files in src/
const allFiles = walkFiles(path.join(process.cwd(), 'src'));
console.log(`Walking ${allFiles.length} TypeScript files under src/...`);

let totalAdded = 0;
for (const file of allFiles) {
  try {
    totalAdded += processFile(file);
  } catch (err) {
    console.error(`Error processing file ${file}:`, err);
  }
}

console.log(`Done! Added total ${totalAdded} JSDoc comments.`);
