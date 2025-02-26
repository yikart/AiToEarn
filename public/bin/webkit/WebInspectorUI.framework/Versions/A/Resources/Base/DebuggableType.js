/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.DebuggableType = {
    ITML: "itml",
    JavaScript: "javascript",
    Page: "page",
    ServiceWorker: "service-worker",
    WebPage: "web-page",
};

WI.DebuggableType.fromString = function(type) {
    switch (type) {
    case "itml":
        return WI.DebuggableType.ITML;
    case "javascript":
        return WI.DebuggableType.JavaScript;
    case "page":
        return WI.DebuggableType.Page;
    case "service-worker":
        return WI.DebuggableType.ServiceWorker;
    case "web-page":
        return WI.DebuggableType.WebPage;
    }

    console.assert(false, "Unknown debuggable type", type);
    return null;
};

WI.DebuggableType.supportedTargetTypes = function(debuggableType) {
    let targetTypes = new Set;

    switch (debuggableType) {
    case WI.DebuggableType.ITML:
        targetTypes.add(WI.TargetType.ITML);
        break;

    case WI.DebuggableType.JavaScript:
        targetTypes.add(WI.TargetType.JavaScript);
        break;

    case WI.DebuggableType.Page:
        targetTypes.add(WI.TargetType.Page);
        targetTypes.add(WI.TargetType.Worker);
        break;

    case WI.DebuggableType.ServiceWorker:
        targetTypes.add(WI.TargetType.ServiceWorker);
        break;

    case WI.DebuggableType.WebPage:
        targetTypes.add(WI.TargetType.Page);
        targetTypes.add(WI.TargetType.WebPage);
        targetTypes.add(WI.TargetType.Worker);
        break;
    }

    console.assert(targetTypes.size, "Unknown debuggable type", debuggableType);
    return targetTypes;
};
