const Routes = (function () {
  const init = function () {
    if (typeof isListRoutes !== 'undefined' && isListRoutes) {
      findMyRoute();
    } else if (typeof isRouteDetail != 'undefined' && isRouteDetail) {
      viewRouteDetails();
    }
    setEvents();
  };

  const setEvents = function () {
    $(document).on('click', '.js-find-routes', findMyRoute);
  };

  const findMyRoute = function () {
    if (!navigator.geolocation) {
      getLocationRoutes({
        coords: {
          latitude: '',
          longitude: ''
        }
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(getLocationRoutes, locationError, { timeout: 5000 });
  };

  const locationError = function (error) {
    // alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
    getLocationRoutes({
      coords: {
        latitude: '',
        longitude: ''
      }
    });
  };

  const getLocationRoutes = function (position) {
    let ajax = $.ajax({
      method: 'GET',
      url: Variables.backendURL + 'route/obtain_routes',
      data: { user_id: app.user.id, latitude: position.coords.latitude, longitude: position.coords.longitude }
    });
    ajax.done(function (data) {
      if (!data || data.length < 1) {
        return;
      }
      const routesListHtml = data.routes.reduce(function (carry, route) {
        const routeHtml = '<li>' +
          '<p>Fecha: ' + route.fecha_creacion + '</p>' +
          '<p>Comentario: ' + route.comentario + '</p>' +
          '<p>Estado: ' + route.estado + '</p>' +
          '<a href="detalle-ruta.html?id=' + route.id + '" class="btn">Ver m&aacute;s</a>' +
          /* '<button class="btn js-take-route" data-id="' + route.id + '">Tomar ruta</button>' + */
        '</li>';
        return carry + routeHtml;
      }, '');
      $('.js-routes-list').html(routesListHtml);
    });
  };

  const viewRouteDetails = function () {
    const params = getAllUrlParams();
    if (params == null) {
      return;
    }
    let ajax = $.ajax({
      data: { route_id: params.id },
      method: 'GET',
      url: Variables.backendURL + 'route/get_route_details'
    });
    ajax.done(function (data) {
      if (!data || data.length < 1) {
        return;
      }
      const routeDetails = data.route.details[0];
      const routeInfoHtml = '<h3>Fecha: ' + routeDetails.fecha_creacion + '</h3>' +
        '<p><b>Estado</b>: ' + routeDetails.estado + '</p>' +
        '<p><b>Comentario</b>: ' + routeDetails.comentario + '</p>' +
        (app.user.id != routeDetails.id_reciclatendero ? '<button class="btn js-take-route" data-id="' + routeDetails.id + '">Tomar ruta</button>' : '');
      $('.js-route-details').html(routeInfoHtml);
      const orderListHtml = data.route.orders.reduce(function (carry, item) {
        const itemHtml = '<li>'+
          '<p>Fecha de Asistencia: ' + item.fecha + '</p>' +
          '<p' + (item.fecha_recogida != null && (item.fecha_recogida).indexOf('0000') < 0 ? ' class="color-primary-0"' : '') + '>' +
            'Fecha de Asistido: ' + (item.fecha_recogida != null ? item.fecha_recogida.split(' ')[0] : 'No recogido') + '</p>' +
          '<div class="row">' +
            '<div class="col-8">' +
              '<p>Ciudad: ' + item.ciudad + '</p>' +
              '<p>Departamento: ' + item.departamento + '</p>' +
            '</div>' +
            '<div class="col-4">' +
              '<a href="detalle-solicitud.html?id=' + item.id + '" class="btn">Ver m&aacute;s</a>' +
            '</div>' +
          '</div>' +
        '</li>';
        return carry + itemHtml;
      }, '');
      $('.js-orders-list').html(orderListHtml);
    });
  };
 


  const getAllUrlParams = function (url) {
    var queryString = url ? url.split('?')[1] : window.location.search.slice(1);
    var obj = {};
    if (!queryString) {
      return null;
    }
    queryString = queryString.split('#')[0];
    var arr = queryString.split('&');

    for (var i = 0; i < arr.length; i++) {
      var a = arr[i].split('=');
      var paramName = a[0];
      var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];
      paramName = paramName.toLowerCase();
      if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();
      if (paramName.match(/\[(\d+)?\]$/)) {
        var key = paramName.replace(/\[(\d+)?\]/, '');
        if (!obj[key]) obj[key] = [];

        if (paramName.match(/\[\d+\]$/)) {
          var index = /\[(\d+)\]/.exec(paramName)[1];
          obj[key][index] = paramValue;
        } else {
          obj[key].push(paramValue);
        }
      } else {
        if (!obj[paramName]) {
          obj[paramName] = paramValue;
        } else if (obj[paramName] && typeof obj[paramName] === 'string') {
          obj[paramName] = [obj[paramName]];
          obj[paramName].push(paramValue);
        } else {
          obj[paramName].push(paramValue);
        }
      }
    }

    return obj;
  };

  return {
    init: init
  }
})();

Routes.init();
