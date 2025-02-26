/*
 *  Copyright (C) 1999 Harri Porten (porten@kde.org)
 *  Copyright (C) 2001 Peter Kelly (pmk@post.com)
 *  Copyright (C) 2008-2019 Apple Inc. All rights reserved.
 *  Copyright (C) 2008 Eric Seidel <eric@webkit.org>
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

#include "FrameLoaderTypes.h"
#include "JSWindowProxy.h"
#include "LoadableScript.h"
#include "SerializedScriptValue.h"
#include "WindowProxy.h"
#include <JavaScriptCore/JSBase.h>
#include <JavaScriptCore/ScriptFetchParameters.h>
#include <JavaScriptCore/Strong.h>
#include <wtf/CheckedRef.h>
#include <wtf/Forward.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/TextPosition.h>

#if PLATFORM(COCOA)
#include <wtf/RetainPtr.h>
OBJC_CLASS JSContext;
OBJC_CLASS WebScriptObject;
#endif

namespace JSC {
class AbstractModuleRecord;
class CallFrame;
class JSGlobalObject;
class JSInternalPromise;

namespace Bindings {
class Instance;
class RootObject;
}
}

namespace WebCore {

class CachedScriptFetcher;
class HTMLDocument;
class HTMLPlugInElement;
class LoadableModuleScript;
class LocalFrame;
class ModuleFetchParameters;
class NavigationAction;
class ScriptSourceCode;
class SecurityOrigin;
class Widget;

enum class RunAsAsyncFunction : bool;

struct ExceptionDetails;
struct RunJavaScriptParameters;

enum class ReasonForCallingCanExecuteScripts : uint8_t {
    AboutToCreateEventListener,
    AboutToExecuteScript,
    NotAboutToExecuteScript
};

using ValueOrException = Expected<JSC::JSValue, ExceptionDetails>;

class ScriptController final : public CanMakeWeakPtr<ScriptController>, public CanMakeCheckedPtr<ScriptController> {
    WTF_MAKE_TZONE_ALLOCATED(ScriptController);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(ScriptController);

    using RootObjectMap = UncheckedKeyHashMap<void*, Ref<JSC::Bindings::RootObject>>;

public:
    explicit ScriptController(LocalFrame&);
    ~ScriptController();

    enum class WorldType { User, Internal };
    WEBCORE_EXPORT static Ref<DOMWrapperWorld> createWorld(const String& name, WorldType = WorldType::Internal);

    JSDOMGlobalObject* globalObject(DOMWrapperWorld& world)
    {
        return jsWindowProxy(world).window();
    }

    static void getAllWorlds(Vector<Ref<DOMWrapperWorld>>&);

    using ResolveFunction = CompletionHandler<void(ValueOrException)>;

    WEBCORE_EXPORT JSC::JSValue executeScriptIgnoringException(const String& script, JSC::SourceTaintedOrigin, bool forceUserGesture = false);
    WEBCORE_EXPORT JSC::JSValue executeScriptInWorldIgnoringException(DOMWrapperWorld&, const String& script, JSC::SourceTaintedOrigin, bool forceUserGesture = false);
    WEBCORE_EXPORT JSC::JSValue executeUserAgentScriptInWorldIgnoringException(DOMWrapperWorld&, const String& script, bool forceUserGesture);
    WEBCORE_EXPORT ValueOrException executeUserAgentScriptInWorld(DOMWrapperWorld&, const String& script, bool forceUserGesture);
    WEBCORE_EXPORT void executeAsynchronousUserAgentScriptInWorld(DOMWrapperWorld&, RunJavaScriptParameters&&, ResolveFunction&&);
    ValueOrException evaluateInWorld(const ScriptSourceCode&, DOMWrapperWorld&);
    JSC::JSValue evaluateIgnoringException(const ScriptSourceCode&);
    JSC::JSValue evaluateInWorldIgnoringException(const ScriptSourceCode&, DOMWrapperWorld&);

    // This asserts that URL argument is a JavaScript URL.
    void executeJavaScriptURL(const URL&, const NavigationAction&, bool& didReplaceDocument);

    static void initializeMainThread();

    void loadModuleScriptInWorld(LoadableModuleScript&, const URL& topLevelModuleURL, Ref<JSC::ScriptFetchParameters>&&, DOMWrapperWorld&);
    void loadModuleScript(LoadableModuleScript&, const URL&, Ref<JSC::ScriptFetchParameters>&&);
    void loadModuleScriptInWorld(LoadableModuleScript&, const ScriptSourceCode&, DOMWrapperWorld&);
    void loadModuleScript(LoadableModuleScript&, const ScriptSourceCode&);

    JSC::JSValue linkAndEvaluateModuleScriptInWorld(LoadableModuleScript& , DOMWrapperWorld&);
    JSC::JSValue linkAndEvaluateModuleScript(LoadableModuleScript&);

    JSC::JSValue evaluateModule(const URL&, JSC::AbstractModuleRecord&, DOMWrapperWorld&, JSC::JSValue awaitedValue, JSC::JSValue resumeMode);
    JSC::JSValue evaluateModule(const URL&, JSC::AbstractModuleRecord&, JSC::JSValue awaitedValue, JSC::JSValue resumeMode);

    TextPosition eventHandlerPosition() const;

    void setEvalEnabled(bool, const String& errorMessage = String());
    void setWebAssemblyEnabled(bool, const String& errorMessage = String());
    void setRequiresTrustedTypes(bool);

    static bool canAccessFromCurrentOrigin(LocalFrame*, Document& accessingDocument);
    WEBCORE_EXPORT bool canExecuteScripts(ReasonForCallingCanExecuteScripts);

    void setPaused(bool b) { m_paused = b; }
    bool isPaused() const { return m_paused; }

    const URL* sourceURL() const { return m_sourceURL; } // nullptr if we are not evaluating any script

    void updateDocument();

    void namedItemAdded(HTMLDocument*, const AtomString&) { }
    void namedItemRemoved(HTMLDocument*, const AtomString&) { }

    void clearScriptObjects();
    WEBCORE_EXPORT void cleanupScriptObjectsForPlugin(void*);

    void updatePlatformScriptObjects();

    RefPtr<JSC::Bindings::Instance>  createScriptInstanceForWidget(Widget*);
    WEBCORE_EXPORT JSC::Bindings::RootObject* bindingRootObject();
    JSC::Bindings::RootObject* cacheableBindingRootObject();
    JSC::Bindings::RootObject* existingCacheableBindingRootObject() const { return m_cacheableBindingRootObject.get(); }

    WEBCORE_EXPORT Ref<JSC::Bindings::RootObject> createRootObject(void* nativeHandle);

    void collectIsolatedContexts(Vector<std::pair<JSC::JSGlobalObject*, SecurityOrigin*>>&);

#if PLATFORM(COCOA)
    WEBCORE_EXPORT WebScriptObject* windowScriptObject();
    WEBCORE_EXPORT JSContext *javaScriptContext();
#endif

    WEBCORE_EXPORT JSC::JSObject* jsObjectForPluginElement(HTMLPlugInElement*);

    void initScriptForWindowProxy(JSWindowProxy&);

    bool willReplaceWithResultOfExecutingJavascriptURL() const { return m_willReplaceWithResultOfExecutingJavascriptURL; }

    void reportExceptionFromScriptError(LoadableScript::Error, bool);

    void registerImportMap(const ScriptSourceCode&, const URL& baseURL);
    bool isAcquiringImportMaps();
    void setAcquiringImportMaps();
    void setPendingImportMaps();
    void clearPendingImportMaps();

private:
    ValueOrException executeScriptInWorld(DOMWrapperWorld&, RunJavaScriptParameters&&);
    ValueOrException callInWorld(RunJavaScriptParameters&&, DOMWrapperWorld&);
    
    void setupModuleScriptHandlers(LoadableModuleScript&, JSC::JSInternalPromise&, DOMWrapperWorld&);

    void disconnectPlatformScriptObjects();

    WEBCORE_EXPORT WindowProxy& windowProxy();
    WEBCORE_EXPORT JSWindowProxy& jsWindowProxy(DOMWrapperWorld&);

    Ref<LocalFrame> protectedFrame() const;

    LocalFrame& m_frame;
    const URL* m_sourceURL { nullptr };

    bool m_paused;
    bool m_willReplaceWithResultOfExecutingJavascriptURL { false };

    // The root object used for objects bound outside the context of a plugin, such
    // as NPAPI plugins. The plugins using these objects prevent a page from being cached so they
    // are safe to invalidate() when WebKit navigates away from the page that contains them.
    RefPtr<JSC::Bindings::RootObject> m_bindingRootObject;
    // Unlike m_bindingRootObject these objects are used in pages that are cached, so they are not invalidate()'d.
    // This ensures they are still available when the page is restored.
    RefPtr<JSC::Bindings::RootObject> m_cacheableBindingRootObject;
    RootObjectMap m_rootObjects;
#if PLATFORM(COCOA)
    RetainPtr<WebScriptObject> m_windowScriptObject;
#endif
};

} // namespace WebCore
