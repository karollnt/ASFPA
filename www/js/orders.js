const Orders = (function () {
  let categories = null;
  let brands = null;

  const init = function () {
    if (typeof isCreateOrder !== 'undefined' && isCreateOrder) {
      $('.js-user-id').val(app.user.id);
      initAccordion();
      getBrands();
      setEvents();
    } else if (typeof isListOrders !== 'undefined' && isListOrders) {
      listUserOrders();
    } else if (typeof isViewOrder !== 'undefined' && isViewOrder) {
      viewOrderDetails();
    }
  };

  const getOrderCategories = function () {
    let ajax = $.ajax({
      method: 'GET',
      url: Variables.backendURL + 'category/get_categories'
    });
    ajax.done(function (data) {
      if (!data || data.length < 1) {
        return;
      }
      categories = JSON.parse(JSON.stringify(data));
      fillFormCategories();
      showStep(3);
    });
  };

  const fillFormCategories = function () {
    const brandId = $('.js-brand-item:checked').val();
    const measurementId = $('.js-measurement-item:checked').val();
    const html = categories.reduce(function (carry, current) {
      if (brandId != current.id_marca || current.id_medida != measurementId) {
        return carry;
      }

      const valueString = current.id + ';' + (current.precio * 1);
      const currentHtml = '<li class="row">' +
        '<div class="col-1">' +
          '<input type="checkbox" id="category_' + current.id + '" name="category" class="js-category-item" value="' + valueString + '" data-id="' + current.id + '"> ' +
        '</div>' +
        '<div class="col-5">' +
          (current.foto ? '<img src="' + current.foto + '">' : '') +
          '<label class="label-checkbox item-content" for="category_' + current.id + '">' +
            current.nombre +
          '</label>' +
        '</div>' +
        '<div class="col-3">' +
          '$ ' + (current.precio * 1) +
        '</div>' +
        '<div class="col-3">' +
          '<input type="number" name="cantidad_' + current.id + '" class="form_input js-item-quantity-' + current.id + '" value="1">' +
        '</div>' +
      '</li>';
      return carry + currentHtml;
    }, '');
    $('.js-object-list').html(html);
  };

  const setEvents = function () {
    $(document)
      .on('submit', '.js-create-request-form', createOrder)
      .on('change', '.js-brand-item', getBrandItems)
      .on('change', '.js-measurement-item', getOrderCategories);
  };

  const createOrder = function (ev) {
    ev.preventDefault();
    const categoryCheckboxes = document.querySelectorAll('.js-category-item:checked');
    let categoryValues = '';
    for (let i = 0; i < categoryCheckboxes.length; i++) {
      const element = categoryCheckboxes[i];
      if (categoryValues != '') {
        categoryValues += '|';
      }
      const elementQuantity = document.querySelector('.js-item-quantity-' + element.getAttribute('data-id'));
      categoryValues += element.value + ';' + elementQuantity.value;
    }
    $('.js-request-objects').val(categoryValues);
    let form = $(ev.target);
    let ajax = $.ajax({
      url: Variables.backendURL + 'order/create_order',
      method: 'POST',
      data: form.serialize()
    });
    ajax.done(function (data) {
      if (data.valid == true) {
        location.href = 'success.html';
      }
    });
  };

  const listUserOrders = function () {
    if (app.user == null) {
      return;
    }
    let ajax = $.ajax({
      url: Variables.backendURL + 'order/get_user_orders',
      data: { user_id: app.user.id, is_recycler: true},
      method: 'GET'
    });
    ajax.done(function (data) {
      if (!data || data.length < 1) {
        return;
      }
      const orderListHtml = data.reduce(function (carry, item) {
        const itemHtml = '<li>'+
          '<p>Fecha de Asistencia: ' + item.fecha + '</p>' +
          '<p' + (item.fecha_recogida != null && (item.fecha_recogida).indexOf('0000') < 0 ? ' class="color-primary-0"' : '') + '>' +
            'Fecha de Asistido: ' + (item.fecha_recogida != null ? item.fecha_recogida.split(' ')[0] : 'No Asistido') + '</p>' +
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

  const viewOrderDetails = function () {
    const params = getAllUrlParams();
    if (params == null) {
      return;
    }
    let ajax = $.ajax({
      data: {order_id: params.id},
      method: 'GET',
      url: Variables.backendURL + 'order/get_order_data'
    });
    ajax.done(function (data) {
      const nombre_recicla_tendero = data.nombre_recicla_tendero == null 
        ? 'No asignado' : data.nombre_recicla_tendero + ' ' + data.apellido_recicla_tendero;
      const html = '<div class="col-6">' +
          '<p><b>Fecha de Asistencia</b><br>' + data.fecha + '</p>' +
        '</div>' +
        '<div class="col-6">' +
          '<p><b>Fecha de Asistido</b><br>' + (data.fecha_recogida ? data.fecha_recogida : 'No Asistido') + '</p>' +
        '</div>' +
        (
          data.id_perfil == 2 ?
            '<div class="col-12">' +
              '<p><b>Nombre cliente</b>: ' + (data.nombre_cliente + ' ' + data.apellido_cliente) + '</p>' +
            '</div>'
            :  ''
        ) +
        '<div class="col-6">' +
          '<p><b>Departamento</b>: ' + data.departamento + '</p>' +
          '<p><b>Ciudad</b>: ' + data.ciudad + '</p>' +
          '<p><b>Direcci&oacute;n</b>: ' + data.direccion + '</p>' +
          '<p><b>Comentario</b>: ' + data.comentario + '</p>' +
          '<p>Tel&eacute;fono: ' + data.telefono + '</p>' +
        '</div>' +
        '<div class="col-6">' +
          '<p><b>Mecanico</b>:</p>' +
          '<img src="' + (data.nombre_recicla_tendero == null ? 'images/avatar.jpg' : data.foto) + '">' +
          '<p><b>' + nombre_recicla_tendero + '</b></p>' +
          '<p>Tel&eacute;fono: ' + data.telefono_empleado + '</p>' +
        '</div>' +
        '<div class="col-12">' +
        '<p><b>Asistencia de la solicitud:</b></p>' +
        '<table class="order-detail-items">' +
          '<thead>' +
            '<tr>' +
              '<th>Producto/servicio</th>' +
              '<th>Cantidad</th>' +
              '<th>Total</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody class="js-order-items"></tbody>' +
        '</table>' +
        '<p class="order-total"><b>Total:</b> $<span class="js-total-price"></span></p>' +
        '</div>';
      let detailsAjax = $.ajax({
        data: { order_id: params.id },
        method: 'GET',
        url: Variables.backendURL + 'order/get_order_details'
      });
      $('.js-order-details').html(html);
      detailsAjax.done(function (detailsData) {
        let total = 0;
        const detailsHtml = detailsData.reduce(function (carry, item) {
          const lineItemPrice = item.precio * item.cantidad;
          total += lineItemPrice;
          const detailHtml = '<tr>' +
            '<td>' + item.nombre_categoria + ' (' + item.nombre_marca + ')<br>' + item.medida + '</td>' +
            '<td>' + item.cantidad + '</td>' +
            '<td>$ ' + lineItemPrice + '</td>' +
          '</tr>';

          return carry + detailHtml;
        }, '');
        $('.js-order-items').html(detailsHtml);
        $('.js-total-price').html(total);
      });
      if (data.id_estado_solicitud == 2) {
        $('.js-set-as-complete')
          .show()
          .attr('data-id', params.id)
          .on('click', setAsCompleted);
      }
    });
  };

  const setAsCompleted = function (ev) {
    const button = ev.target;
    const id = button.getAttribute('data-id');
    let ajax = $.ajax({
      data: { order_id: id },
      method: 'POST',
      url: Variables.backendURL + 'order/set_as_completed'
    });
    ajax.done(function (data) {
      if (data.valid == true) {
        window.location.reload();
        return;
      }
      alert('No se pudo actualizar, intente m&acute;s tarde');
    })
    .fail(function (data) {
      alert('No se pudo actualizar, intente m&acute;s tarde');
    });
  };

  const getBrands = function () {
    let ajax = $.ajax({
      method: 'GET',
      url: Variables.backendURL + 'category/get_brands'
    });
    ajax.done(function (data) {
      if (!data || data.length < 1) {
        return;
      }
      brands = JSON.parse(JSON.stringify(data));
      fillBrands();
    });
  };

  const initAccordion = function () {
    let acc = document.getElementsByClassName("accordion");

    for (let i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        let panel = this.nextElementSibling;
        if (panel.style.display === "block") {
          panel.style.display = "none";
        } else {
          panel.style.display = "block";
        }
      });
    }
  };

  const fillBrands = function () {
    const html = brands.reduce(function (carry, current) {
      const currentHtml = '<li class="col-6">' +
        '<label class="label-radio item-content" for="brand_' + current.id + '">' +
          '<input type="radio" id="brand_' + current.id + '" name="brand" class="js-brand-item" value="' + current.id + '" data-index="' + current.id + '"> ' +
          '<span class="item-title">' + current.nombre + '</span>' +
        '</label>' +
      '</li>';
      return carry + currentHtml;
    }, '');
    $('.js-brand-list').html(html);
  };

  const showStep = function (step) {
    $('#togg' + step).prop('checked', true);
    $('#togg' + step)[0].scrollIntoView({block: 'start', behavior: 'smooth'});
  };

  const getBrandItems = function () {
    getMeasurements();
  };

  const getMeasurements = function () {
    let ajax = $.ajax({
      method: 'GET',
      url: Variables.backendURL + 'category/get_measurements'
    });
    ajax.done(function (data) {
      if (!data || data.length < 1) {
        return;
      }
      measurements = JSON.parse(JSON.stringify(data));
      fillMeasurements();
      showStep(2);
    });
  };

  const fillMeasurements = function () {
    const html = measurements.reduce(function (carry, current) {
      const currentHtml = '<li class="row">' +
        '<div class="col-12">' +
          '<label class="label-radio item-content" for="measurement_' + current.id + '">' +
            '<input type="radio" id="measurement_' + current.id + '" name="measurement" class="js-measurement-item" value="' + current.id + '" data-id="' + current.id + '"> ' +
            '<span class="item-title">' + current.nombre + '</span>' +
          '</label>' +
        '</div>' +
      '</li>';
      return carry + currentHtml;
    }, '');
    $('.js-measurement-list').html(html);
  };

  return {
    init: init
  };
})();

Orders.init();
