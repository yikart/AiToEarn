#!/usr/bin/env python3
#
# Copyright (c) 2014 Apple Inc. All rights reserved.
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

class ObjCGeneratorTemplates:

    HeaderPrelude = (
    """#import <Foundation/Foundation.h>

${includes}
""")

    HeaderPostlude = (
    """
${includes}
""")

    TypeConversionsHeaderPrelude = (
    """${includes}

namespace Inspector {""")

    TypeConversionsHeaderPostlude = (
    """} // namespace Inspector
""")

    GenericHeaderPrelude = (
    """${includes}""")

    GenericHeaderPostlude = (
    """""")

    TypeConversionsHeaderStandard = (
    """template<typename ObjCEnumType>
std::optional<ObjCEnumType> fromProtocolString(const String& value);""")

    BackendDispatcherHeaderPrelude = (
    """${includes}

${forwardDeclarations}

namespace Inspector {
""")

    BackendDispatcherHeaderPostlude = (
    """} // namespace Inspector
""")

    BackendDispatcherImplementationPrelude = (
    """#import "config.h"
#import ${primaryInclude}

${secondaryIncludes}

namespace Inspector {""")

    BackendDispatcherImplementationPostlude = (
    """} // namespace Inspector
""")

    ImplementationPrelude = (
    """#import ${primaryInclude}

${secondaryIncludes}

using namespace Inspector;""")

    ImplementationPostlude = (
    """""")

    BackendDispatcherHeaderDomainHandlerInterfaceDeclaration = (
    """class Alternate${domainName}BackendDispatcher : public AlternateBackendDispatcher {
public:
    virtual ~Alternate${domainName}BackendDispatcher() { }
${commandDeclarations}
};""")

    BackendDispatcherHeaderDomainHandlerObjCDeclaration = (
    """class ObjCInspector${domainName}BackendDispatcher final : public Alternate${domainName}BackendDispatcher {
    WTF_MAKE_FAST_ALLOCATED;
public:
    ObjCInspector${domainName}BackendDispatcher(id<${objcPrefix}${domainName}DomainHandler> handler) { m_delegate = handler; }
${commandDeclarations}
private:
    RetainPtr<id<${objcPrefix}${domainName}DomainHandler>> m_delegate;
};""")

    BackendDispatcherHeaderDomainHandlerImplementation = (
    """void ObjCInspector${domainName}BackendDispatcher::${commandName}(${parameters})
{
    if (!${respondsToSelector}) {
        backendDispatcher()->reportProtocolError(protocol_requestId, BackendDispatcher::MethodNotFound, "'${domainName}.${commandName}' was not found"_s);
        backendDispatcher()->sendPendingErrors();
        return;
    }

    id errorCallback = ^(NSString *error) {
        backendDispatcher()->reportProtocolError(protocol_requestId, BackendDispatcher::ServerError, error);
        backendDispatcher()->sendPendingErrors();
    };

${successCallback}
${conversions}
${invocation}
}""")

    ConfigurationCommandProperty = (
    """@property (nonatomic, retain, setter=set${domainName}Handler:) id<${objcPrefix}${domainName}DomainHandler> ${variableNamePrefix}Handler;""")

    ConfigurationEventProperty = (
    """@property (nonatomic, readonly) ${objcPrefix}${domainName}DomainEventDispatcher *${variableNamePrefix}EventDispatcher;""")

    ConfigurationCommandPropertyImplementation = (
    """- (void)set${domainName}Handler:(id<${objcPrefix}${domainName}DomainHandler>)handler
{
    if (handler == _${variableNamePrefix}Handler)
        return;

    _${variableNamePrefix}Handler = handler;

    auto alternateDispatcher = makeUnique<ObjCInspector${domainName}BackendDispatcher>(handler);
    auto alternateAgent = makeUnique<AlternateDispatchableAgent<${domainName}BackendDispatcher, Alternate${domainName}BackendDispatcher>>("${domainName}"_s, *_controller, WTFMove(alternateDispatcher));
    _controller->registerAlternateAgent(WTFMove(alternateAgent));
}

- (id<${objcPrefix}${domainName}DomainHandler>)${variableNamePrefix}Handler
{
    return _${variableNamePrefix}Handler.get();
}""")

    ConfigurationGetterImplementation = (
    """- (${objcPrefix}${domainName}DomainEventDispatcher *)${variableNamePrefix}EventDispatcher
{
    if (!_${variableNamePrefix}EventDispatcher)
        _${variableNamePrefix}EventDispatcher = adoptNS([[${objcPrefix}${domainName}DomainEventDispatcher alloc] initWithController:_controller]);
    return _${variableNamePrefix}EventDispatcher.get();
}""")
