/*
 * Copyright (C) 2008-2022 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "JSDOMConvertInterface.h"
#include "WindowProxy.h"
#include <JavaScriptCore/JSGlobalProxy.h>

namespace JSC {
class Debugger;
}

namespace WebCore {

class DOMWindow;
class Frame;

class WEBCORE_EXPORT JSWindowProxy final : public JSC::JSGlobalProxy {
public:
    using Base = JSC::JSGlobalProxy;
    static constexpr bool needsDestruction = true;
    static void destroy(JSCell*);

    template<typename CellType, JSC::SubspaceAccess> static JSC::GCClient::IsoSubspace* subspaceFor(JSC::VM& vm) { return subspaceForImpl(vm); }

    static JSWindowProxy& create(JSC::VM&, DOMWindow&, DOMWrapperWorld&);

    DECLARE_INFO;

    JSDOMGlobalObject* window() const { return static_cast<JSDOMGlobalObject*>(target()); }

    void setWindow(JSC::VM&, JSDOMGlobalObject&);
    void setWindow(DOMWindow&);

    WindowProxy* windowProxy() const;

    DOMWindow& wrapped() const;
    static WindowProxy* toWrapped(JSC::VM&, JSC::JSValue);

    DOMWrapperWorld& world();
    Ref<DOMWrapperWorld> protectedWorld();

    void attachDebugger(JSC::Debugger*);

private:
    JSWindowProxy() = delete;
    JSWindowProxy(const JSWindowProxy&) = delete;
    JSWindowProxy(JSWindowProxy&&) = delete;
    JSWindowProxy(JSC::VM&, JSC::Structure&, DOMWrapperWorld&);
    ~JSWindowProxy();
    void finishCreation(JSC::VM&, DOMWindow&);
    static JSC::GCClient::IsoSubspace* subspaceForImpl(JSC::VM&);

#if ENABLE(WINDOW_PROXY_PROPERTY_ACCESS_NOTIFICATION)
    static bool getOwnPropertySlot(JSC::JSObject*, JSC::JSGlobalObject*, JSC::PropertyName, JSC::PropertySlot&);
    static bool getOwnPropertySlotByIndex(JSC::JSObject*, JSC::JSGlobalObject*, unsigned, JSC::PropertySlot&);
    static bool put(JSC::JSCell*, JSC::JSGlobalObject*, JSC::PropertyName, JSC::JSValue, JSC::PutPropertySlot&);
    static bool putByIndex(JSC::JSCell*, JSC::JSGlobalObject*, unsigned, JSC::JSValue, bool shouldThrow);
    static bool deleteProperty(JSC::JSCell*, JSC::JSGlobalObject*, JSC::PropertyName, JSC::DeletePropertySlot&);
    static bool deletePropertyByIndex(JSC::JSCell*, JSC::JSGlobalObject*, unsigned);
    static bool defineOwnProperty(JSC::JSObject*, JSC::JSGlobalObject*, JSC::PropertyName, const JSC::PropertyDescriptor&, bool shouldThrow);
#endif

    Ref<DOMWrapperWorld> m_world;
};

// JSWindowProxy is a little odd in that it's not a traditional wrapper and has no back pointer.
// It is, however, strongly owned by Frame via its WindowProxy, so we can get one from a WindowProxy.
WEBCORE_EXPORT JSC::JSValue toJS(JSC::JSGlobalObject*, WindowProxy&);
inline JSC::JSValue toJS(JSC::JSGlobalObject* lexicalGlobalObject, WindowProxy* windowProxy) { return windowProxy ? toJS(lexicalGlobalObject, *windowProxy) : JSC::jsNull(); }
inline JSC::JSValue toJS(JSC::JSGlobalObject* lexicalGlobalObject, JSDOMGlobalObject*, WindowProxy& windowProxy) { return toJS(lexicalGlobalObject, windowProxy); }
inline JSC::JSValue toJS(JSC::JSGlobalObject* lexicalGlobalObject, JSDOMGlobalObject* globalObject, WindowProxy* windowProxy) { return windowProxy ? toJS(lexicalGlobalObject, globalObject, *windowProxy) : JSC::jsNull(); }

JSWindowProxy* toJSWindowProxy(WindowProxy&, DOMWrapperWorld&);
inline JSWindowProxy* toJSWindowProxy(WindowProxy* windowProxy, DOMWrapperWorld& world) { return windowProxy ? toJSWindowProxy(*windowProxy, world) : nullptr; }


template<> struct JSDOMWrapperConverterTraits<WindowProxy> {
    using WrapperClass = JSWindowProxy;
    using ToWrappedReturnType = WindowProxy*;
};

} // namespace WebCore
