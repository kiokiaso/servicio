

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
io.socket.on('nuevo_mensaje', function(data) {
    const userId = data.de;
    const nombreRemitente = data.nombreDe || 'Usuario';

    const selector = `#content-${userId}`;

    if ($(`#chat-${userId}`).length === 0) {
        abrirChat(userId, nombreRemitente, false);
    } else {
        const chat = $(`#chat-${userId}`);

        // 👇 solo mostrar si NO está minimizado
        if (!chat.hasClass('minimized')) {
            chat.show();
        }
    }

    esperarElemento(selector, () => {
        setTimeout(() => {
                dibujarMensajeEnVentana(userId, data.texto, 'recibido');
            }, 200);
    });
});
io.socket.on('usuario_conectado', function(data) {
  actualizarListaUsuarios();
});
io.socket.on('usuario_desconectado', function(data) {
    // Cuando alguien se desconecta, refrescamos la lista automáticamente
    actualizarListaUsuarios();
});

function actualizarListaUsuarios() {
  $.get('/usuarios/conectados', function(usuarios) {
    $('#contadorUsuarios').text(usuarios.length);
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
function toggleListaContactos() {
    const lista = $('#userListContainer');
    const visible = lista.is(':visible');

    if (visible) {
        lista.slideUp(150);
        localStorage.setItem('contactosVisible', 'false');
    } else {
        lista.slideDown(150);
        localStorage.setItem('contactosVisible', 'true');
    }
}

$(document).ready(function() {
    restaurarChats();
    const visible = localStorage.getItem('contactosVisible');

    if (visible === 'true') {
        $('#userListContainer').show();
    } else {
        $('#userListContainer').hide();
    }
});
function esperarElemento(selector, callback) {
    const elemento = document.querySelector(selector);

    if (elemento) {
        callback(elemento);
        return;
    }

    const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
            observer.disconnect();
            callback(el);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
function guardarEstadoChat(id, name, minimized = false) {
    let chats = JSON.parse(localStorage.getItem('chatsEstado') || '[]');

    const index = chats.findIndex(c => String(c.id) === String(id));

    if (index >= 0) {
        chats[index].minimized = minimized;
    } else {
        chats.push({ id, name, minimized });
    }

    localStorage.setItem('chatsEstado', JSON.stringify(chats));
}
function abrirChat(userId, userName, minimized = false) {
    userId = String(userId).trim();
    const chat = document.getElementById(`chat-${userId}`);
    if (chat && chat.querySelector(`#content-${userId}`)) {
        if (!$(chat).hasClass('minimized')) {
            $(chat).show();
        }
        guardarEstadoChat(userId, userName, minimized);
        return;
    }

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
    //console.log("Container existe:", $('.chat-bar-container').length);
   // console.log("HTML generado:", chatHtml);
    $('.chat-bar-container').prepend(chatHtml);

    if (minimized) {
        $(`#chat-${userId}`).addClass('minimized');
    }
    setTimeout(() => {
        if (minimized === true) {
            $(`#chat-${userId}`).addClass('minimized');
        }
    }, 0);

    guardarEstadoChat(userId, userName, true);

    // 👇 ya no importa timing
    cargarHistorial(userId);
}

function cargarHistorial(userId) {
    const selector = `#content-${userId}`;

    esperarElemento(selector, (containerEl) => {
        const container = $(containerEl);

        container.html('<small class="text-muted">Cargando...</small>');

        io.socket.get(`/chat/historial/${userId}`, function(mensajes, jwr) {

            if (jwr.statusCode !== 200) {
                container.html('<small class="text-danger">Error al cargar</small>');
                return;
            }

            container.html('');

            if (Array.isArray(mensajes)) {
                let miId = document.body.getAttribute('data-my-id');

                mensajes.forEach(m => {
                    let tipo = (m.de == miId) ? 'enviado' : 'recibido';
                    container.append(`<div class="msg-bubble ${tipo === 'enviado' ? 'msg-enviado' : 'msg-recibido'}">${m.texto}</div>`);
                });

                setTimeout(() => {
                    const el = container[0];
                    if (el) {
                        el.scrollTop = el.scrollHeight;
                    }
                }, 300);
            }
        });
    });
}
function cerrarChat(userId) {
    $(`#chat-${userId}`).remove();

    let chats = JSON.parse(localStorage.getItem('chatsEstado') || '[]');
    chats = chats.filter(c => String(c.id) !== String(userId));

    localStorage.setItem('chatsEstado', JSON.stringify(chats));
}

function removerChatDeStorage(id) {
    let chatsActivos = JSON.parse(localStorage.getItem('chatsActivos') || '[]');
    chatsActivos = chatsActivos.filter(c => c.id !== id);
    localStorage.setItem('chatsActivos', JSON.stringify(chatsActivos));
}
function restaurarChats() {
    const chats = JSON.parse(localStorage.getItem('chatsEstado') || '[]');

    chats.forEach(chat => {
        abrirChat(chat.id, chat.name, chat.minimized);
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
    const container = $(`#content-${userId}`);
    const el = container[0]; 
    if (container.length === 0|| !container[0]) return;

    const isAtBottom = container.scrollTop() + container.innerHeight() >= container[0].scrollHeight - 20;

    const clase = tipo === 'enviado' ? 'msg-enviado' : 'msg-recibido';
    container.append(`<div class="msg-bubble ${clase}">${texto}</div>`);

    setTimeout(() => {
        el.scrollTop = el.scrollHeight;
    }, 50);
}
function toggleChat(userId) {
    const chat = $(`#chat-${userId}`);
    chat.toggleClass('minimized');

    let minimized = chat.hasClass('minimized');

    let chats = JSON.parse(localStorage.getItem('chatsEstado') || '[]');
    chats = chats.map(c => {
        if (String(c.id) === String(userId)) {
            c.minimized = minimized;
        }
        return c;
    });

    localStorage.setItem('chatsEstado', JSON.stringify(chats));
}

/*io.socket.on('nuevo_mensaje', function(data) {
    if (chatConId !== data.de) {
        const nombreRemitente = data.nombreDe || 'Usuario'; 
        abrirChat(data.de, nombreRemitente);
    } else {
        dibujarMensajeEnVentana(data.de,data.texto, 'recibido');
    }
});*/
/* sin probario.socket.on('nuevo_mensaje', function(data) {
    const userId = data.de;
    const nombreRemitente = data.nombreDe || 'Usuario';

    let chatExiste = $(`#chat-${userId}`).length > 0;

    if (!chatExiste) {
        abrirChat(userId, nombreRemitente, false);

        // 👇 IMPORTANTE: esperar a que se cargue historial
        setTimeout(() => {
            dibujarMensajeEnVentana(userId, data.texto, 'recibido');
        }, 300);

    } else {
        $(`#chat-${userId}`).show().removeClass('minimized');
        dibujarMensajeEnVentana(userId, data.texto, 'recibido');
    }
});*/
/* más reciente io.socket.on('nuevo_mensaje', function(data) {
    const userId = data.de;
    const nombreRemitente = data.nombreDe || 'Usuario';
    console.log("Mensaje recibido")
   
    if ($(`#chat-${userId}`).length === 0) {
        abrirChat(userId, nombreRemitente,false);
    } else {
        $(`#chat-${userId}`).show().removeClass('minimized');
    }
    setTimeout(() => {
        dibujarMensajeEnVentana(userId, data.texto, 'recibido');
    }, 100);
});*/

// Escuchar cambios de usuarios conectados
/*function cerrarChat(userId) {
    $(`#chat-${userId}`).remove();
    removerChatDeStorage(userId);

    let cerrados = JSON.parse(localStorage.getItem('chatsCerrados') || '[]');
    if (!cerrados.includes(userId)) {
        cerrados.push(userId);
        localStorage.setItem('chatsCerrados', JSON.stringify(cerrados));
    }
}*/

// PERSISTENCIA: Guardar en LocalStorage
/*function guardarEstadoChat(id, name) {
    let chatsActivos = JSON.parse(localStorage.getItem('chatsActivos') || '[]');
    if (!chatsActivos.find(c => c.id === id)) {
        chatsActivos.push({ id, name });
        localStorage.setItem('chatsActivos', JSON.stringify(chatsActivos));
    }
}*/

/*function restaurarChats() {
    const chatsActivos = JSON.parse(localStorage.getItem('chatsActivos') || '[]');
    const cerrados = JSON.parse(localStorage.getItem('chatsCerrados') || '[]');
    console.log("Activos",chatsActivos,"Cerrados",cerrados)
    chatsActivos.forEach(chat => {
        //abrirChat(chat.id, chat.name);
        console.log("Entra antes de la comparación",cerrados.includes(chat.id))
        if (!cerrados.map(String).includes(String(chat.id))) {
            console.log("Entra")
            abrirChat(chat.id, chat.name);
        }
    });
}*/
/*function abrirChat(userId, userName, minimized = false) {

    if ($(`#chat-${userId}`).length > 0) {
        $(`#chat-${userId}`).show().removeClass('minimized');
        guardarEstadoChat(userId, userName, false);
        return;
    }

    const chatHtml = `...`; // tu template igual

    $('.chat-bar-container').prepend(chatHtml);

    // 👇 aplicar minimized correctamente
    if (minimized) {
        $(`#chat-${userId}`).addClass('minimized');
    }

    guardarEstadoChat(userId, userName, minimized);

    // 👇 cargar historial SIEMPRE
    cargarHistorial(userId);
}*/
/*function abrirChat(userId, userName) {
    

    // Si ya existe la ventana, solo la mostramos
    if ($(`#chat-${userId}`).length > 0) {
        $(`#chat-${userId}`).show().removeClass('minimized');
        guardarEstadoChat(userId, userName, false);
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
    //guardarEstadoChat(userId, userName);
    guardarEstadoChat(userId, userName, minimized);
    if (!historialCargado[userId]) {
        cargarHistorial(userId);
        historialCargado[userId] = true;
    }
}*/

/*sin probarfunction cargarHistorial(userId) {
    const container = $(`#content-${userId}`);
    if (container.length === 0) {
        console.warn("Contenedor aún no existe:", userId);
        return;
    }
    
    container.html('<small class="text-muted">Cargando...</small>');

    io.socket.get(`/chat/historial/${userId}`, function(mensajes, jwr) {

        if (jwr.statusCode !== 200) {
            container.html('<small class="text-danger">Error al cargar</small>');
            return;
        }

        container.html('');

        if (Array.isArray(mensajes)) {
            let miId = document.body.getAttribute('data-my-id');

            mensajes.forEach(m => {
                let tipo = (m.de == miId) ? 'enviado' : 'recibido';
                container.append(`<div class="msg-bubble ${tipo === 'enviado' ? 'msg-enviado' : 'msg-recibido'}">${m.texto}</div>`);
            });

            // 👇 bajar scroll al final SIEMPRE en historial
            if (container.length > 0 && container[0]) {
                container.scrollTop(container[0].scrollHeight);
            }
        }
    });
}*/
/*function cargarHistorial(userId) {
    const container = $(`#content-${userId}`);
    
    container.html('<small class="text-muted">Cargando...</small>');

    io.socket.get(`/chat/historial/${userId}`, function(mensajes, jwr) {

        if (jwr.statusCode !== 200) {
            container.html('<small class="text-danger">Error al cargar</small>');
            return;
        }

        container.html('');

        if (Array.isArray(mensajes)) {
            mensajes.forEach(m => {

                // 👇 necesitas tu ID actual (ajústalo según tu app)
                let miId = document.body.getAttribute('data-my-id');

                let tipo = (m.de == miId) ? 'enviado' : 'recibido';

                dibujarMensajeEnVentana(userId, m.texto, tipo);
            });
        }
    });
}*/

/*function toggleChat(userId) {
    $(`#chat-${userId}`).toggleClass('minimized');
    // Actualizar icono si deseas
}*/
/*function dibujarMensajeEnVentana(userId, texto, tipo) {
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
}*/


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
