/*
 *  Copyright (C) 1999-2001 Harri Porten (porten@kde.org)
 *  Copyright (C) 2003, 2004, 2005, 2006, 2008, 2009 Apple Inc. All rights reserved.
 *  Copyright (C) 2007 Samuel Weinig <sam@webkit.org>
 *  Copyright (C) 2009 Google, Inc. All rights reserved.
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

#include <wtf/Compiler.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

#include "JSDOMGlobalObject.h"
#include <wtf/Forward.h>
#include <wtf/WeakPtr.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

namespace WebCore {

class WindowProxy;

typedef UncheckedKeyHashMap<void*, JSC::Weak<JSC::JSObject>> DOMObjectWrapperMap;

class DOMWrapperWorld : public RefCounted<DOMWrapperWorld>, public CanMakeSingleThreadWeakPtr<DOMWrapperWorld> {
public:
    enum class Type {
        Normal,   // Main (e.g. Page)
        User,     // User Scripts (e.g. Extensions)
        Internal, // WebKit Internal (e.g. Media Controls)
    };

    static Ref<DOMWrapperWorld> create(JSC::VM& vm, Type type = Type::Internal, const String& name = { })
    {
        return adoptRef(*new DOMWrapperWorld(vm, type, name));
    }
    WEBCORE_EXPORT ~DOMWrapperWorld();

    // Free as much memory held onto by this world as possible.
    WEBCORE_EXPORT void clearWrappers();

    void didCreateWindowProxy(WindowProxy* controller) { m_jsWindowProxies.add(controller); }
    void didDestroyWindowProxy(WindowProxy* controller) { m_jsWindowProxies.remove(controller); }

    void setAllowAutofill() { m_allowAutofill = true; }
    bool allowAutofill() const { return m_allowAutofill; }

    void setAllowElementUserInfo() { m_allowElementUserInfo = true; }
    bool allowElementUserInfo() const { return m_allowElementUserInfo; }

    void setShadowRootIsAlwaysOpen() { m_shadowRootIsAlwaysOpen = true; }
    bool shadowRootIsAlwaysOpen() const { return m_shadowRootIsAlwaysOpen; }

    void disableLegacyOverrideBuiltInsBehavior() { m_shouldDisableLegacyOverrideBuiltInsBehavior = true; }
    bool shouldDisableLegacyOverrideBuiltInsBehavior() const { return m_shouldDisableLegacyOverrideBuiltInsBehavior; }

    DOMObjectWrapperMap& wrappers() { return m_wrappers; }

    Type type() const { return m_type; }
    bool isNormal() const { return m_type == Type::Normal; }
    bool isUser() const { return m_type == Type::User; }

    const String& name() const { return m_name; }

    JSC::VM& vm() const { return m_vm; }

protected:
    DOMWrapperWorld(JSC::VM&, Type, const String& name);

private:
    JSC::VM& m_vm;
    HashSet<WindowProxy*> m_jsWindowProxies;
    DOMObjectWrapperMap m_wrappers;

    String m_name;
    Type m_type { Type::Internal };

    bool m_allowAutofill { false };
    bool m_allowElementUserInfo { false };
    bool m_shadowRootIsAlwaysOpen { false };
    bool m_shouldDisableLegacyOverrideBuiltInsBehavior { false };
};

DOMWrapperWorld& normalWorld(JSC::VM&);
WEBCORE_EXPORT DOMWrapperWorld& mainThreadNormalWorld();
inline Ref<DOMWrapperWorld> protectedMainThreadNormalWorld() { return mainThreadNormalWorld(); }

inline DOMWrapperWorld& debuggerWorld() { return mainThreadNormalWorld(); }
inline DOMWrapperWorld& pluginWorld() { return mainThreadNormalWorld(); }

DOMWrapperWorld& currentWorld(JSC::JSGlobalObject&);
DOMWrapperWorld& worldForDOMObject(JSC::JSObject&);

// Helper function for code paths that must not share objects across isolated DOM worlds.
bool isWorldCompatible(JSC::JSGlobalObject&, JSC::JSValue);

inline DOMWrapperWorld& currentWorld(JSC::JSGlobalObject& lexicalGlobalObject)
{
    return JSC::jsCast<JSDOMGlobalObject*>(&lexicalGlobalObject)->world();
}

inline DOMWrapperWorld& worldForDOMObject(JSC::JSObject& object)
{
    return JSC::jsCast<JSDOMGlobalObject*>(object.globalObject())->world();
}

inline bool isWorldCompatible(JSC::JSGlobalObject& lexicalGlobalObject, JSC::JSValue value)
{
    return !value.isObject() || &worldForDOMObject(*value.getObject()) == &currentWorld(lexicalGlobalObject);
}

} // namespace WebCore
