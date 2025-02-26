/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#pragma once

#include "IDLTypes.h"
#include <JavaScriptCore/Strong.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

namespace JSC {
class JSObject;
} // namespace JSC

namespace WTF {
class String;
}

namespace WebCore {

class NavigatorBase;
class PermissionStatus;
class ScriptExecutionContext;
enum class PermissionName : uint8_t;
enum class PermissionQuerySource : uint8_t;

template<typename IDLType> class DOMPromiseDeferred;

class Permissions : public RefCounted<Permissions> {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(Permissions);
public:
    static Ref<Permissions> create(NavigatorBase&);
    ~Permissions();

    NavigatorBase* navigator();
    void query(JSC::Strong<JSC::JSObject>, DOMPromiseDeferred<IDLInterface<PermissionStatus>>&&);
    WEBCORE_EXPORT static std::optional<PermissionQuerySource> sourceFromContext(const ScriptExecutionContext&);
    WEBCORE_EXPORT static std::optional<PermissionName> toPermissionName(const String&);

private:
    explicit Permissions(NavigatorBase&);

    WeakPtr<NavigatorBase> m_navigator;
};

} // namespace WebCore
