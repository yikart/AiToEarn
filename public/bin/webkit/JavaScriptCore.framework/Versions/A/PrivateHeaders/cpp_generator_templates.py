#!/usr/bin/env python3
#
# Copyright (c) 2014-2018 Apple Inc. All rights reserved.
# Copyright (c) 2014 University of Washington. All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
# 1. Redistributions of source code must retain the above copyright
#    notice, this list of conditions and the following disclaimer.
# 2. Redistributions in binary form must reproduce the above copyright
#    notice, this list of conditions and the following disclaimer in the
#    documentation and/or other materials provided with the distribution.
#
# THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
# THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
# PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
# BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
# CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
# SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
# INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
# CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
# ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
# THE POSSIBILITY OF SUCH DAMAGE.

# Generator templates, which can be filled with string.Template.
# Following are classes that fill the templates from the typechecked model.

class CppGeneratorTemplates:

    HeaderPrelude = (
    """#pragma once

${includes}

namespace Inspector {

${typedefs}""")

    HeaderPostlude = (
    """} // namespace Inspector""")

    ImplementationPrelude = (
    """#include "config.h"
#include ${primaryInclude}

${secondaryIncludes}

namespace Inspector {""")

    ImplementationPostlude = (
    """} // namespace Inspector
""")

    AlternateDispatchersHeaderPrelude = (
    """#pragma once

#if ENABLE(INSPECTOR_ALTERNATE_DISPATCHERS)

${includes}

namespace Inspector {

class AlternateBackendDispatcher {
public:
    void setBackendDispatcher(RefPtr<BackendDispatcher>&& dispatcher) { m_backendDispatcher = WTFMove(dispatcher); }
    BackendDispatcher* backendDispatcher() const { return m_backendDispatcher.get(); }
private:
    RefPtr<BackendDispatcher> m_backendDispatcher;
};
""")

    AlternateDispatchersHeaderPostlude = (
    """} // namespace Inspector

#endif // ENABLE(INSPECTOR_ALTERNATE_DISPATCHERS)""")

    AlternateBackendDispatcherHeaderDomainHandlerInterfaceDeclaration = (
    """class Alternate${domainName}BackendDispatcher : public AlternateBackendDispatcher {
public:
    virtual ~Alternate${domainName}BackendDispatcher() { }
${commandDeclarations}
};""")

    BackendDispatcherHeaderDomainHandlerDeclaration = (
    """${classAndExportMacro} ${domainName}BackendDispatcherHandler {
public:
${commandDeclarations}
protected:
    virtual ~${domainName}BackendDispatcherHandler();
};""")

    BackendDispatcherHeaderDomainDispatcherDeclaration = (
    """${classAndExportMacro} ${domainName}BackendDispatcher final : public SupplementalBackendDispatcher {
public:
    static Ref<${domainName}BackendDispatcher> create(BackendDispatcher&, ${domainName}BackendDispatcherHandler*);
    void dispatch(long protocol_requestId, const String& protocol_method, Ref<JSON::Object>&& protocol_message) final;
${commandDeclarations}
private:
    ${domainName}BackendDispatcher(BackendDispatcher&, ${domainName}BackendDispatcherHandler*);
    ${domainName}BackendDispatcherHandler* m_agent { nullptr };
};""")

    BackendDispatcherHeaderDomainDispatcherAlternatesDeclaration = (
    """#if ENABLE(INSPECTOR_ALTERNATE_DISPATCHERS)
public:
    void setAlternateDispatcher(Alternate${domainName}BackendDispatcher* alternateDispatcher) { m_alternateDispatcher = alternateDispatcher; }
private:
    Alternate${domainName}BackendDispatcher* m_alternateDispatcher { nullptr };
#endif // ENABLE(INSPECTOR_ALTERNATE_DISPATCHERS)""")

    BackendDispatcherHeaderAsyncCommandDeclaration = (
    """    ${classAndExportMacro} ${callbackName} : public BackendDispatcher::CallbackBase {
    public:
        ${callbackName}(Ref<BackendDispatcher>&&, int id);
        void sendSuccess(${returns});
    };
    virtual void ${commandName}(${parameters}) = 0;""")

    BackendDispatcherImplementationSmallSwitch = (
    """void ${domainName}BackendDispatcher::dispatch(long protocol_requestId, const String& protocol_method, Ref<JSON::Object>&& protocol_message)
{
    Ref<${domainName}BackendDispatcher> protect(*this);

    auto protocol_parameters = protocol_message->getObject("params"_s);

${dispatchCases}

    m_backendDispatcher->reportProtocolError(BackendDispatcher::MethodNotFound, makeString("'${domainName}."_s, protocol_method, "' was not found"_s));
}""")

    BackendDispatcherImplementationLargeSwitch = (
"""void ${domainName}BackendDispatcher::dispatch(long protocol_requestId, const String& protocol_method, Ref<JSON::Object>&& protocol_message)
{
    Ref<${domainName}BackendDispatcher> protect(*this);

    auto protocol_parameters = protocol_message->getObject("params"_s);

    using CallHandler = void (${domainName}BackendDispatcher::*)(long protocol_requestId, RefPtr<JSON::Object>&& protocol_message);
    using DispatchMap = HashMap<String, CallHandler>;
    static NeverDestroyed<DispatchMap> dispatchMap = DispatchMap({
${dispatchCases}
    });

    auto findResult = dispatchMap->find(protocol_method);
    if (findResult == dispatchMap->end()) {
        m_backendDispatcher->reportProtocolError(BackendDispatcher::MethodNotFound, makeString("'${domainName}."_s, protocol_method, "' was not found"_s));
        return;
    }

    ((*this).*findResult->value)(protocol_requestId, WTFMove(protocol_parameters));
}""")

    BackendDispatcherImplementationDomainConstructor = (
    """Ref<${domainName}BackendDispatcher> ${domainName}BackendDispatcher::create(BackendDispatcher& backendDispatcher, ${domainName}BackendDispatcherHandler* agent)
{
    return adoptRef(*new ${domainName}BackendDispatcher(backendDispatcher, agent));
}

${domainName}BackendDispatcher::${domainName}BackendDispatcher(BackendDispatcher& backendDispatcher, ${domainName}BackendDispatcherHandler* agent)
    : SupplementalBackendDispatcher(backendDispatcher)
    , m_agent(agent)
{
    m_backendDispatcher->registerDispatcherForDomain("${domainName}"_s, this);
}""")

    BackendDispatcherImplementationPrepareCommandArguments = (
"""${parameterDeclarations}
    if (m_backendDispatcher->hasProtocolErrors()) {
        m_backendDispatcher->reportProtocolError(BackendDispatcher::InvalidParams, "Some arguments of method \'${domainName}.${commandName}\' can't be processed"_s);
        return;
    }
""")

    BackendDispatcherImplementationAsyncCommand = (
"""${domainName}BackendDispatcherHandler::${callbackName}::${callbackName}(Ref<BackendDispatcher>&& backendDispatcher, int id) : BackendDispatcher::CallbackBase(WTFMove(backendDispatcher), id) { }

void ${domainName}BackendDispatcherHandler::${callbackName}::sendSuccess(${callbackParameters})
{
    auto protocol_jsonMessage = JSON::Object::create();
${returnAssignments}
    CallbackBase::sendSuccess(WTFMove(protocol_jsonMessage));
}""")

    FrontendDispatcherDomainDispatcherDeclaration = (
"""${classAndExportMacro} ${domainName}FrontendDispatcher {
    WTF_MAKE_FAST_ALLOCATED;
public:
    ${domainName}FrontendDispatcher(FrontendRouter& frontendRouter) : m_frontendRouter(frontendRouter) { }
${eventDeclarations}
private:
    FrontendRouter& m_frontendRouter;
};""")

    ProtocolObjectBuilderDeclarationPrelude = (
"""    template<int STATE>
    class Builder {
    private:
        RefPtr<JSON::Object> m_result;

        template<int STEP> Builder<STATE | STEP>& castState()
        {
            return *reinterpret_cast<Builder<STATE | STEP>*>(this);
        }

        Builder(Ref</*${objectType}*/JSON::Object>&& object)
            : m_result(WTFMove(object))
        {
            static_assert(STATE == NoFieldsSet, "builder created in non init state");
        }
        friend class ${objectType};
    public:""")

    ProtocolObjectBuilderDeclarationPostlude = (
"""
        Ref<${objectType}> release()
        {
            static_assert(STATE == AllFieldsSet, "result is not ready");
            static_assert(sizeof(${objectType}) == sizeof(JSON::Object), "cannot cast");

            Ref<JSON::Object> jsonResult = m_result.releaseNonNull();
            auto result = WTFMove(*reinterpret_cast<Ref<${objectType}>*>(&jsonResult));
            return result;
        }
    };

    /*
     * Synthetic constructor:
${constructorExample}
     */
    static Builder<NoFieldsSet> create()
    {
        return Builder<NoFieldsSet>(JSON::Object::create());
    }""")

    ProtocolObjectRuntimeCast = (
"""Ref<${objectType}> BindingTraits<${objectType}>::runtimeCast(Ref<JSON::Value>&& value)
{
    auto result = value->asObject();
    BindingTraits<${objectType}>::assertValueHasExpectedType(result.get());
    static_assert(sizeof(${objectType}) == sizeof(JSON::ObjectBase), "type cast problem");
    return static_reference_cast<${objectType}>(static_reference_cast<JSON::ObjectBase>(result.releaseNonNull()));
}
""")
