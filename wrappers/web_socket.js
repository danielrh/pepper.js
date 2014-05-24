// Copyright (c) 2013 Google Inc. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function() {
/*

Queue.js

A function to represent a queue

Created by Stephen Morley - http://code.stephenmorley.org/ - and released under
the terms of the CC0 1.0 Universal legal code:

http://creativecommons.org/publicdomain/zero/1.0/legalcode

*/

  /* Creates a new queue. A queue is a first-in-first-out (FIFO) data structure -
   * items are added to the end of the queue and removed from the front.
   */
  function Queue(){
      
      // initialise the queue and offset
      var queue  = [];
      var offset = 0;
      
      // Returns the length of the queue.
      this.getLength = function(){
          return (queue.length - offset);
      };
      
      // Returns true if the queue is empty, and false otherwise.
      this.isEmpty = function(){
          return (queue.length == 0);
      };
      
      /* Enqueues the specified item. The parameter is:
       *
       * item - the item to enqueue
       */
      this.enqueue = function(item){
          queue.push(item);
      };
      
      /* Dequeues an item and returns it. If the queue is empty, the value
       * 'undefined' is returned.
       */
      this.dequeue = function(){
          
          // if the queue is empty, return immediately
          if (queue.length == 0) return undefined;
          
          // store the item at the front of the queue
          var item = queue[offset];
          
          // increment the offset and remove the free space if necessary
          if (++ offset * 2 >= queue.length){
              queue  = queue.slice(offset);
              offset = 0;
          }
          
          // return the dequeued item
          return item;
          
      };
      
      /* Returns the item at the front of the queue (without dequeuing it). If the
       * queue is empty then undefined is returned.
       */
      this.peek = function(){
          return (queue.length > 0 ? queue[offset] : undefined);
      };
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
  function performCallback(socket, data){
      
  }
  var WebSocket_Connect = function(socket, url, protocols, protocol_count, callback) {
    if (protocol_count > 1) {
        // currently don't support protocol lists
        return ppapi.PP_ERROR_FAILED;
    }
    var protocol = [];
    if (protocol_count == 1) {
        protocol = [glue.memoryToJSVar(protocols)];
    }
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppapi.PP_ERROR_BADRESOURCE;
    }
    url = glue.memoryToJSVar(url);
    callback = glue.getCompletionCallback(callback);
    var req;
    req = new WebSocket(url, protocol); // FIXME: deal with protocol array
    req.binaryType = "arraybuffer";
    socket.websocket = req;
    socket.closeWasClean = false;
    socket.closeCode = 0;
    socket.closeReason = "";
    socket.closeCallback = null;
    socket.onmessageCallback = null;
    socket.onmessageWritableVar = null;
    socket.receiveQueue = new Queue();

    req.onclose = function (evt) {
        if (req.closeCallback !== null && !socket.dead) {
            socket.closeCallback(ppapi.PP_OK);
            socket.closeCallback = null;
        }
        socket.closeWasClean = evt.wasClean;
        socket.closeCode = evt.closeCode;
        socket.closeReason = evt.closeReason;
    };
    req.onmessage = function(evt) {
        if (socket.onmessageCallback !== null) {
            var memoryDestination = socket.onmessageWritableVar;
            var callback = socket.onmessageCallback;
            socket.onmessageWritableVar = null;
            socket.onmessageCallback = null; //set it null now in case callback sets it again
            glue.jsToMemoryVar(evt.data, memoryDestination);
            callback(ppapi.PP_OK);
        } else {
            socket.receiveQueue.enqueue(evt.data);
        }
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

    return ppapi.PP_OK_COMPLETIONPENDING;
  };

  var WebSocket_Close = function(socket, code_u16, reason, callback) {
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppapi.PP_ERROR_BADRESOURCE;
    }
    reason = glue.memoryToJSVar(reason);
    if (reason.length > 123) {
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
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppapi.PP_ERROR_BADRESOURCE;
    }
    callback = glue.getCompletionCallback(callback);
    if (!socket.websocket) { // not connected yet
        return ppapi.PP_ERROR_FAILED;
    }
    if (socket.receiveQueue.isEmpty()) {
        socket.onmessageWritableVar = message_ptr;
        socket.onmessageCallback = callback;
        return ppapi.PP_OK_COMPLETIONPENDING;
    } else {
        glue.jsToMemoryVar(evt.data, message_ptr);
        return ppapi.PP_OK;
    }
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
    message = glue.memoryToJSVar(message);
    socket.websocket.send(message);
    return ppapi.PP_OK;
  };

  var WebSocket_GetBufferedAmount = function(socket) {
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (socket === undefined) {
      return 0;
    }
    if (!socket.websocket){
        return 0;
    }
    return socket.websocket.bufferedAmount;
  };

  var WebSocket_GetCloseCode = function(socket) {
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (socket === undefined) {
      return 0;
    }
    return socket.closeCode;
  };

  var WebSocket_GetCloseReason = function(socket) {
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppappi.PP_VARTYPE_UNDEFINED;
    }
    return socket.closeReason;
  };

  var WebSocket_GetCloseWasClean = function(socket) {
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (socket === undefined) {
      return 0;
    }
    return socket.closeWasClean;
  };

  var WebSocket_GetExtensions = function(socket) {
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppapi.PP_VARTYPE_UNDEFINED;
    }
    return "";
  };

  var WebSocket_GetProtocol = function(socket) {
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppapi.PP_VARTYPE_UNDEFINED;
    }
    if (!socket.websocket){
        return "";
    }
    return socket.websocket.protocol;
  };

  var WebSocket_GetReadyState = function(socket) {
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
    if (socket === undefined) {
      return ppapi.PP_VARTYPE_UNDEFINED;
    }
    if (!socket.websocket){
        return ppapi.PP_WEBSOCKETREADYSTATE_INVALID;
    }
    return socket.websocket.readyState;
  };

  var WebSocket_GetURL = function(socket) {
    socket = resources.resolve(socket, WEB_SOCKET_RESOURCE);
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
