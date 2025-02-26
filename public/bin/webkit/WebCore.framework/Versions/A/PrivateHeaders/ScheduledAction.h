/*
 *  Copyright (C) 2000 Harri Porten (porten@kde.org)
 *  Copyright (C) 2003, 2004, 2005, 2006, 2007, 2008, 2009 Apple Inc. All rights reseved.
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

#include <JavaScriptCore/Strong.h>
#include <JavaScriptCore/StrongInlines.h>
#include <memory>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/WTFString.h>

namespace JSC {
class JSGlobalObject;
}

namespace WebCore {

class DOMWrapperWorld;
class Document;
class ScriptExecutionContext;
class WorkerGlobalScope;

class ScheduledAction {
    WTF_MAKE_TZONE_ALLOCATED(ScheduledAction);
public:
    static std::unique_ptr<ScheduledAction> create(DOMWrapperWorld&, JSC::Strong<JSC::JSObject>&&);
    static std::unique_ptr<ScheduledAction> create(DOMWrapperWorld&, String&&);
    ~ScheduledAction();

    void addArguments(FixedVector<JSC::Strong<JSC::Unknown>>&&);

    enum class Type { Code, Function };
    Type type() const;

    StringView code() const { return m_code; }

    void execute(ScriptExecutionContext&);

private:
    ScheduledAction(DOMWrapperWorld&, JSC::Strong<JSC::JSObject>&&);
    ScheduledAction(DOMWrapperWorld&, String&&);

    void executeFunctionInContext(JSC::JSGlobalObject*, JSC::JSValue thisValue, ScriptExecutionContext&);
    void execute(Document&);
    void execute(WorkerGlobalScope&);

    Ref<DOMWrapperWorld> m_isolatedWorld;
    JSC::Strong<JSC::JSObject> m_function;
    FixedVector<JSC::Strong<JSC::Unknown>> m_arguments;
    String m_code;
    JSC::SourceTaintedOrigin m_sourceTaintedOrigin;
};

} // namespace WebCore
