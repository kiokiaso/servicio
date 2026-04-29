

$(document).ready(function () {
    notificaciones();

});
function notificaciones(){
  let fecha=new Date(); 
  let cantidad=0;
    $.post(
        '/notificaciones/no-leidas',
        { id: 1 },
        function (respuesta) {
          console.log(respuesta.enviar);
          let html="";
          if(respuesta.enviar.length>0){
            respuesta.enviar.forEach(element => {
              if(element.tipoId==12){
                if(element.notificacionesusuario==respuesta.userId){
                  cantidad++;
                  html=html+`<a onclick="verNotificacion(${element.orden})" class="dropdown-item pointer">
                    <!-- Message Start -->
                    <div class="media">`;
                    if(element.usuarioavatar==""){
                      html=html+`<img src="/images/perfil/vacio.png" alt="User Avatar" class="img-size-50 mr-3 img-circle">`;
                    }else{
                      html=html+`<img src="${element.usuarioavatar}" alt="User Avatar" class="img-size-50 mr-3 img-circle">`;
                    }

                      html=html+`<div class="media-body">
                        <h3 class="dropdown-item-title">
                          ${element.usuarionombre}
                          <span class="float-right text-sm text-danger"><i class="fas fa-star"></i></span>
                        </h3>
                        <p class="text-sm">${element.notificacionesnombre}</p>
                        <p class="text-sm text-muted"><i class="far fa-clock mr-1"></i> ${element.createdAt.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</p>
                      </div>
                    </div>
                    <!-- Message End -->
                  </a>
                  <div class="dropdown-divider"></div>`;
                }
              }
              else{
                cantidad++;
                html=html+`<a onclick="verNotificacion(${element.orden})" class="dropdown-item pointer">
                  <!-- Message Start -->
                  <div class="media">`;
                  if(element.usuarioavatar==""){
                    html=html+`<img src="/images/perfil/vacio.png" alt="User Avatar" class="img-size-50 mr-3 img-circle">`;
                  }else{
                    html=html+`<img src="${element.usuarioavatar}" alt="User Avatar" class="img-size-50 mr-3 img-circle">`;
                  }

                    html=html+`<div class="media-body">
                      <h3 class="dropdown-item-title">
                        ${element.usuarionombre}
                        <span class="float-right text-sm text-danger"><i class="fas fa-star"></i></span>
                      </h3>
                      <p class="text-sm">${element.notificacionesnombre}</p>
                      <p class="text-sm text-muted"><i class="far fa-clock mr-1"></i> ${element.createdAt.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</p>
                    </div>
                  </div>
                  <!-- Message End -->
                </a>
                <div class="dropdown-divider"></div>`;
              }
            });
          }
          else{
            html=html+`<a class="dropdown-item pointer">
                <!-- Message Start -->
                <div class="media">
                  <img src="/images/perfil/vacio.png" alt="User Avatar" class="img-size-50 mr-3 img-circle">
                  <div class="media-body">
                    <h3 class="dropdown-item-title">
                      Sistema
                      <span class="float-right text-sm text-danger"><i class="fas fa-star"></i></span>
                    </h3>
                    <p class="text-sm">No tienes notificaciones disponibles</p>
                    <p class="text-sm text-muted"><i class="far fa-clock mr-1"></i> `+fecha+`</p>
                  </div>
                </div>
                <!-- Message End -->
              </a>
              <div class="dropdown-divider"></div>`;
          }
          document.getElementById('cantidadNotificaciones').innerHTML=cantidad;
          document.getElementById('verNotificaciones').innerHTML=html;
        }
      ).fail(function (res) {

      });
}
function verNotificacion(id){
    $.post(
        '/notificaciones/ver',
        { id: id },
        function (respuesta) {
          $('#showNotification').modal('show');
          document.getElementById('showNotificationTitle').innerHTML=respuesta.notificacion.tiponotificaciones.nombre;
          document.getElementById('showNotificationContent').innerHTML=respuesta.notificacion.descripcion;
          document.getElementById('autor').innerHTML=respuesta.notificacion.usuario.nombre;
          document.getElementById('idNotification').value=respuesta.notificacion.id;
        }
      ).fail(function (res) {

      });
    //$('#images').modal('show');

}
function closeShowNotification(){
    let id=document.getElementById('idNotification').value;
    $.post(
        '/notificaciones/visto',
        { id: id },
        function (respuesta) {
            notificaciones();
            $('#showNotification').modal('hide');
        }
      ).fail(function (res) {

      });

}
