

let chatConId = null;
let socketIdActual=null


document.addEventListener('DOMContentLoaded', function() {
    io.socket.on('connect', function() {
      io.socket.get('/chat/conectar', function(data, jwr) {
        if(jwr.statusCode === 200) {
           console.log('Conectado al chat');
           actualizarListaUsuarios();
        }
      });
    });
  });

/*io.socket.on('nuevo_mensaje', function(data) {
    if (chatConId !== data.de) {
        const nombreRemitente = data.nombreDe || 'Usuario'; 
        abrirChat(data.de, nombreRemitente);
    } else {
        dibujarMensajeEnVentana(data.de,data.texto, 'recibido');
    }
});*/
io.socket.on('nuevo_mensaje', function(data) {
    const userId = data.de;
    const nombreRemitente = data.nombreDe || 'Usuario';

    // 1. Si la ventana NO existe, la creamos
    if ($(`#chat-${userId}`).length === 0) {
        abrirChat(userId, nombreRemitente);
    } else {
        // Si existe pero estaba minimizada o oculta, la mostramos
        $(`#chat-${userId}`).show().removeClass('minimized');
    }

    // 2. IMPORTANTE: Agregamos un pequeño delay para asegurar que el DOM 
    // se haya renderizado si la ventana es nueva, y dibujamos.
    setTimeout(() => {
        dibujarMensajeEnVentana(userId, data.texto, 'recibido');
    }, 100);
});

// Escuchar cambios de usuarios conectados
io.socket.on('usuario_conectado', function(data) {
  actualizarListaUsuarios();
});
io.socket.on('usuario_desconectado', function(data) {
    // Cuando alguien se desconecta, refrescamos la lista automáticamente
    actualizarListaUsuarios();
});

function actualizarListaUsuarios() {
  $.get('/usuarios/conectados', function(usuarios) {
    let html = '';
    usuarios.forEach(u => {
      // Determinamos el color del punto basado en el campo 'online'
      const dotColor = u.online ? '#28a745' : '#bdc3c7'; 
      
      html += `
        <li class="list-group-item list-group-item-action pointer d-flex align-items-center" 
            onclick="abrirChat('${u.id}', '${u.nombre}')" 
            style="cursor: pointer; padding: 10px;">
          <span class="mr-2" style="height: 10px; width: 10px; background-color: ${dotColor}; border-radius: 50%; display: inline-block;"></span> 
          ${u.nombre}
        </li>`;
    });
    $('#userListContainer').html(html);
  });
}

// Al cargar la página, restaurar chats abiertos
$(document).ready(function() {
    restaurarChats();
});

function abrirChat(userId, userName) {
    // Si ya existe la ventana, solo la mostramos
    if ($(`#chat-${userId}`).length > 0) {
        $(`#chat-${userId}`).show().removeClass('minimized');
        return;
    }

    // Template de la nueva ventana
    const chatHtml = `
    <div id="chat-${userId}" class="card shadow-lg chat-window">
        <div class="card-header bg-primary text-white d-flex align-items-center" style="padding: 5px 10px;">
            <!-- flex-grow-1 hace que el nombre ocupe todo el espacio disponible, empujando lo demás a la derecha -->
            <strong class="text-truncate flex-grow-1" style="max-width: 150px;">
                ${userName}
            </strong>
            
            <div class="chat-controls d-flex align-items-center">
                <button class="btn btn-sm text-white p-1 ml-1" onclick="toggleChat('${userId}')" style="background: transparent; border: none;">
                    <i class="fas fa-minus"></i>
                </button>
                <button class="btn btn-sm text-white p-1 ml-1" onclick="cerrarChat('${userId}')" style="background: transparent; border: none; font-size: 1.2rem; line-height: 1;">
                    &times;
                </button>
            </div>
        </div>
        <div class="chat-body">
            <div class="chat-history-area" id="content-${userId}"></div>
            <div class="card-footer p-2 bg-white">
                <input type="text" class="form-control form-control-sm" 
                       placeholder="Escribe..." onkeypress="enviarMensaje(event, '${userId}')">
            </div>
        </div>
    </div>`;

    $('.chat-bar-container').prepend(chatHtml);
    guardarEstadoChat(userId, userName);
}

function toggleChat(userId) {
    $(`#chat-${userId}`).toggleClass('minimized');
    // Actualizar icono si deseas
}

function cerrarChat(userId) {
    $(`#chat-${userId}`).remove();
    removerChatDeStorage(userId);
}

// PERSISTENCIA: Guardar en LocalStorage
function guardarEstadoChat(id, name) {
    let chatsActivos = JSON.parse(localStorage.getItem('chatsActivos') || '[]');
    if (!chatsActivos.find(c => c.id === id)) {
        chatsActivos.push({ id, name });
        localStorage.setItem('chatsActivos', JSON.stringify(chatsActivos));
    }
}

function removerChatDeStorage(id) {
    let chatsActivos = JSON.parse(localStorage.getItem('chatsActivos') || '[]');
    chatsActivos = chatsActivos.filter(c => c.id !== id);
    localStorage.setItem('chatsActivos', JSON.stringify(chatsActivos));
}

function restaurarChats() {
    const chatsActivos = JSON.parse(localStorage.getItem('chatsActivos') || '[]');
    chatsActivos.forEach(chat => {
        abrirChat(chat.id, chat.name);
    });
}

function enviarMensaje(event, userId) {
    // Verificamos si la tecla presionada es Enter (código 13)
    if (event.which === 13 || event.keyCode === 13) {
        const input = $(event.target);
        const texto = input.val().trim();
        if (texto !== "") {
            chatConId=userId
            // Enviamos el mensaje al servidor
            io.socket.post('/chat/enviar', { para: userId, texto: texto }, (data, jwr) => {
                if (jwr.statusCode === 200) {
                    // Pintamos el mensaje en la ventana correcta
                    dibujarMensajeEnVentana(userId, texto, 'enviado');
                    input.val(''); // Limpiamos el input
                } else {
                    console.error("Error al enviar mensaje", data);
                }
            });
        }
    }
}
function dibujarMensajeEnVentana(userId, texto, tipo) {
    const clase = tipo === 'enviado' ? 'msg-enviado' : 'msg-recibido';
    const container = $(`#content-${userId}`);
    
    //container.append(`<div class="msg-bubble ${clase}">${texto}</div>`);
    if (container.length > 0) {
        container.append(`<div class="msg-bubble ${clase}">${texto}</div>`);
        // Scroll al final
        container.scrollTop(container[0].scrollHeight);
    } else {
        console.error("No se encontró el contenedor de chat para:", userId);
    }
    // Auto-scroll al final del contenedor de esa ventana específica
    //container.scrollTop(container[0].scrollHeight);
}


// Escuchar nuevos mensajes
/*io.socket.on('nuevo_mensaje', function(msg) {
  if (chatConId == msg.de) {
    dibujarMensaje(msg.texto, 'recibido');
  } else {
    // Aquí puedes disparar una notificación de SweetAlert o un sonido
    //Toast.fire({ icon: 'info', title: 'Nuevo mensaje recibido' });
      const Toast = Swal.mixin({ toast: true, position: 'bottom-start', showConfirmButton: false, timer: 3000 });
      Toast.fire({ icon: 'info', title: 'Nuevo mensaje de ' + data.nombreDe });
    
  }
});*/
/*

$(document).on('keypress', '#inputChat', function(e) {
    console.log("tecla presionada:", e.which);
    if(e.which == 13 && $(this).val().trim() != "") {
        let texto = $(this).val();
        io.socket.post('/chat/enviar', { para: chatConId, texto: texto }, (data) => {
            dibujarMensaje(texto, 'enviado'); // Usa el nombre de tu función (dibujarMensaje o appendMessage)
            $(this).val('');
        });
    }
});
function dibujarMensaje(texto, tipo) {
    const clase = tipo === 'enviado' ? 'msg-enviado' : 'msg-recibido';
    $('#chatContent').append(`<div class="msg-bubble ${clase}">${texto}</div>`);
    // Scroll al final
    $('#chatContent').scrollTop($('#chatContent')[0].scrollHeight);
  }
function abrirChat(id, nombre) {
  chatConId = id;
  
    $('#chatUserName').text(nombre);
    $('#chatBox').show();
    $('#chatContent').html('<small class="text-center text-muted">Cargando historial...</small>');
    
    // Cargar historial desde la BD
    io.socket.get('/chat/historial/' + id, function(mensajes,jwr) {
      if (jwr.statusCode !== 200) {
            console.error('Error al cargar historial:', mensajes);
            $('#chatContent').html('<small class="text-danger">Error al cargar mensajes</small>');
            return;
        }

        $('#chatContent').html('');

        // Validamos que sea un array
        if (Array.isArray(mensajes)) {
            mensajes.forEach(m => {
                // OJO: En el JS del navegador no puedes usar <%= %> directamente
                // Usa una variable global o un data-attribute para tu ID
                let miId = document.body.getAttribute('data-my-id'); 
                let tipo = (m.de == miId) ? 'enviado' : 'recibido';
                dibujarMensaje(m.texto, tipo);
            });
        }
    });
}*/
  /*
  Dibujar chat en abrirChat
  const chatHtml = `
<div id="chat-${userId}" class="card shadow-lg chat-window" data-userid="${userId}">
    <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <strong>${userName}</strong>
        <div class="chat-controls">
            <button onclick="toggleChat('${userId}')"><i class="fas fa-minus"></i></button>
            <button onclick="cerrarChat('${userId}')">&times;</button>
        </div>
    </div>
    <div class="chat-body">
        <div class="chat-history-area msg-container" id="content-${userId}"></div>
        <div class="card-footer p-2 bg-white">
            <input type="text" class="form-control form-control-sm input-chat-dinamico" 
                   data-para="${userId}" placeholder="Escribe un mensaje...">
        </div>
    </div>
</div>`;

onkeypress modificado
$(document).on('keypress', '.input-chat-dinamico', function(e) {
    if(e.which == 13 && $(this).val().trim() != "") {
        let texto = $(this).val();
        let paraId = $(this).data('para'); // Obtenemos el ID del destinatario desde el atributo data
        let inputActual = $(this);

        io.socket.post('/chat/enviar', { para: paraId, texto: texto }, (data) => {
            // Llamamos a la función indicando en qué ventana dibujar
            dibujarMensaje(paraId, texto, 'enviado');
            inputActual.val('');
        });
    }
});
dibujarmensaje
function dibujarMensaje(userId, texto, tipo) {
    const clase = tipo === 'enviado' ? 'msg-enviado' : 'msg-recibido';
    
    // Buscamos el contenedor de mensajes de esa ventana específica
    const contenedor = $(`#content-${userId}`);
    
    if (contenedor.length > 0) {
        contenedor.append(`<div class="msg-bubble ${clase}">${texto}</div>`);
        
        // Scroll al final del contenedor específico
        contenedor.scrollTop(contenedor[0].scrollHeight);
    }
}
    Recepción de mensaje
    io.socket.on('mensaje', function(data) {
    // 1. data.de -> ID del que envía
    // 2. data.nombre -> Nombre del que envía
    
    // Abrimos la ventana si no existe (la función abrirChat ya evita duplicados)
    abrirChat(data.de, data.nombre);
    
    // Dibujamos el mensaje como 'recibido' en esa ventana
    dibujarMensaje(data.de, data.texto, 'recibido');
});
  */
