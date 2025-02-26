/*
 *  Copyright (C) 1999 Harri Porten (porten@kde.org)
 *  Copyright (C) 2004, 2006, 2007, 2008 Apple Inc. All rights reserved.
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public
 *  License along with this library; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */

#pragma once

#include "JSDOMBinding.h"

namespace JSC {
namespace Bindings {
class Instance;
}
}

namespace WebCore {

    class HTMLElement;
    class JSHTMLElement;

    // JavaScript access to plug-in-exported properties for JSHTMLEmbedElement and JSHTMLObjectElement.

    JSC::Bindings::Instance* pluginInstance(HTMLElement&);
    WEBCORE_EXPORT JSC::JSObject* pluginScriptObject(JSC::JSGlobalObject*, JSHTMLElement*);

    bool pluginElementCustomGetOwnPropertySlot(JSHTMLElement*, JSC::JSGlobalObject*, JSC::PropertyName, JSC::PropertySlot&);
    bool pluginElementCustomPut(JSHTMLElement*, JSC::JSGlobalObject*, JSC::PropertyName, JSC::JSValue, JSC::PutPropertySlot&, bool& putResult);
    JSC::CallData pluginElementCustomGetCallData(JSHTMLElement*);

} // namespace WebCore
