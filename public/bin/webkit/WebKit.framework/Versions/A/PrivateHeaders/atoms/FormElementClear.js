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

function(element) {
    "use strict";

    function isEditable(element) {
        if (element.disabled || element.readOnly)
            return false;

        if (element instanceof HTMLTextAreaElement)
            return true;

        if (element.isContentEditable)
            return true;

        if (element.tagName.toUpperCase() != "INPUT")
            return false;

        switch (element.type) {
        case "color":
        case "date":
        case "datetime-local":
        case "email":
        case "file":
        case "month":
        case "number":
        case "password":
        case "range":
        case "search":
        case "tel":
        case "text":
        case "time":
        case "url":
        case "week":
            return true;
        }

        return false;
    }

    if (!isEditable(element))
        throw {name: "InvalidElementState", message: "Element must be user-editable in order to clear."};

    // Clear a content editable element.
    if (element.isContentEditable) {
        if (element.innerHTML === "")
            return;

        element.focus();
        element.innerHTML = "";
        element.blur();
        return;
    }

    // Clear a resettable element.
    function isResettableElementEmpty(element) {
        if (element instanceof HTMLInputElement && element.type == "file")
            return element.files.length == 0;
        return element.value === "";
    }

    if (element.validity.valid && isResettableElementEmpty(element))
        return;

    element.focus();
    element.value = "";
    var event = document.createEvent("Event");
    event.initEvent("change", true, true);
    element.dispatchEvent(event);
    element.blur();
}
