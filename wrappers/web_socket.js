// Copyright (c) 2013 Google Inc. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function() {

  var updatePendingRead = function(socket) {
    if (socket.pendingReadCallback) {
      var full_read_possible = socket.data.byteLength >= socket.index + socket.pendingReadSize
      if (socket.done || full_read_possible){
        var cb = socket.pendingReadCallback;
        socket.pendingReadCallback = null;
        var readSize = full_read_possible ? socket.pendingReadSize : socket.data.byteLength - socket.index;
        var index = socket.index;
        socket.index += readSize;
        cb(readSize, new Uint8Array(socket.data, index, readSize));
      }
    }
  };

  var WebSocket_Create = function(instance) {
    return resources.register(WEB_SOCKET_RESOURCE, {
      destroy: function() {
      }
    });
  };

  var WebSocket_IsWebSocket = function(resource) {
    return resources.is(resource, WEB_SOCKET_RESOURCE);
  };

  var WebSocket_Connect = function(socket, url, protocols, protocol_count, callback) {
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppapi.PP_ERROR_BADRESOURCE;
    }
    callback = glue.getCompletionCallback(callback);
    var req = new WebSocket(url); // FIXME: deal with protocol array
    req.binaryType = "arraybuffer";
    socket.websocket = req;
    socket.closeWasClean = false;
    socket.closeCode = 0;
    socket.closeReason = "";
    socket.closeCallback = null;
    req.onclose = function (evt) {
        if (req.closeCallback !== null && !socket.dead) {
            socket.closeCallback(ppapi.PP_OK);
            socket.closeCallback = null;
        }
        socket.closeWasClean = evt.wasClean;
        socket.closeCode = evt.closeCode;
        socket.closeReason = evt.closeReason;
    };
    req.onopen = function() {
      if (socket.dead) {
        return;
      }
      callback(ppapi.PP_OK);
    };
    // Called on network errors and CORS failiures.
    // Note that we do not explicitly distinguish CORS failiures because this information is not exposed to JavaScript.
    req.onerror = function(e) {
      if (socket.dead) {
        return;
      }
      callback(ppapi.PP_ERROR_FAILED);
    };
    req.send();

    return ppapi.PP_OK_COMPLETIONPENDING;
  };

  var WebSocket_Close = function(socket, code_u16, reason, callback) {
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppapi.PP_ERROR_BADRESOURCE;
    }
    if (reason.length() > 123) {
        return ppapi.PP_ERROR_BADARGUMENT;
    }
    if (code_u16 != 1000 && !(code_uint16 >= 3000 && code_uint16 <4999)) {
        return ppapi.PP_ERROR_NOACCESS;
    }
    if (socket.closeCallback) {
        return ppapi.PP_ERROR_INPROGRESS;
    }
    socket.closeCallback = glue.getCompletionCallback(callback);
    socket.websocket.close(code_u16, reason);
    return ppapi.PP_OK_COMPLETIONPENDING;
  };

  var WebSocket_ReceiveMessage = function(socket, message_ptr, callback) {
    var s = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (s === undefined) {
      return 0;
    }
    callback = glue.getCompletionCallback(callback);
    if (!socket.websocket) { // not connected yet
        return ppapi.PP_ERROR_FAILED;
    }
    socket.websocket.onmessage = function (evt) {
        glue.jsToMemoryVar(evt.data, message_ptr);
        callback(ppapi.PP_OK);
    };
    return ppapi.PP_OK_COMPLETIONPENDING;
  };

  var WebSocket_SendMessage = function(socket, message) {
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppapi.PP_ERROR_BADRESOURCE;
    }
    if (!socket.websocket) { // not connected yet
        return ppapi.ERROR_FAILED;
    }
    if (socket.websocket.readyState == 0) {
        return ppapi.PP_ERROR_FAILED;
    }
    socket.websocket.send(message);
    return ppapi.PP_OK;
  };

  var WebSocket_GetBufferedAmount = function(socket) {
    socket = resources.resolve(socket, Web_SOCKET_RESOURCE);
    if (socket === undefined) {
      return 0;
    }
    if (!socket.websocket){
        return 0;
    }
    return socket.websocket.bufferedAmount;
  };

  var WebSocket_GetCloseCode = function(socket) {
    socket = resources.resolve(socket, Web_SOCKET_RESOURCE);
    if (socket === undefined) {
      return 0;
    }
    return socket.closeCode;
  };

  var WebSocket_GetCloseReason = function(socket) {
    socket = resources.resolve(socket, Web_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppappi.PP_VARTYPE_UNDEFINED;
    }
    return socket.closeReason;
  };

  var WebSocket_GetCloseWasClean = function(socket) {
    socket = resources.resolve(socket, Web_SOCKET_RESOURCE);
    if (socket === undefined) {
      return 0;
    }
    return socket.closeWasClean;
  };

  var WebSocket_GetExtensions = function(socket) {
    socket = resources.resolve(socket, Web_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppapi.PP_VARTYPE_UNDEFINED;
    }
    return "";
  };

  var WebSocket_GetProtocol = function(socket) {
    socket = resources.resolve(socket, Web_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppapi.PP_VARTYPE_UNDEFINED;
    }
    if (!socket.websocket){
        return "";
    }
    return socket.websocket.protocol;
  };

  var WebSocket_GetReadyState = function(socket) {
    socket = resources.resolve(socket, Web_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppapi.PP_VARTYPE_UNDEFINED;
    }
    if (!socket.websocket){
        return ppapi.PP_WEBSOCKETREADYSTATE_INVALID;
    }
    return socket.websocket.readyState;
  };

  var WebSocket_GetURL = function(socket) {
    socket = resources.resolve(socket, Web_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppapi.PP_VARTYPE_UNDEFINED;
    }
    if (!socket.websocket){
        return "";
    }
    return socket.websocket.url;
  };

  registerInterface("PPB_WebSocket;1.0", [
    WebSocket_Create,
    WebSocket_IsWebSocket,
    WebSocket_Connect,
    WebSocket_Close,
    WebSocket_ReceiveMessage,
    WebSocket_SendMessage,
    WebSocket_GetBufferedAmount,
    WebSocket_GetCloseCode,
    WebSocket_GetCloseReason,
    WebSocket_GetCloseWasClean,
    WebSocket_GetExtensions,
    WebSocket_GetProtocol,
    WebSocket_GetReadyState,
    WebSocket_GetURL
  ]);

})();
