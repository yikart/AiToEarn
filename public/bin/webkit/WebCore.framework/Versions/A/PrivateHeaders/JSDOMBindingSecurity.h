/*
 *  Copyright (C) 1999-2001 Harri Porten (porten@kde.org)
 *  Copyright (C) 2003-2006, 2008-2009, 2013, 2016 Apple Inc. All rights reserved.
 *  Copyright (C) 2007 Samuel Weinig <sam@webkit.org>
 *  Copyright (C) 2009 Google, Inc. All rights reserved.
 *  Copyright (C) 2012 Ericsson AB. All rights reserved.
 *  Copyright (C) 2013 Michael Pruett <michael@68k.org>
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

#include "ExceptionOr.h"
#include <wtf/Forward.h>

namespace JSC {
class CallFrame;
class JSGlobalObject;
}

namespace WebCore {

class DOMWindow;
class LocalDOMWindow;
class LocalFrame;
class Node;

void printErrorMessageForFrame(LocalFrame*, const String& message);

enum SecurityReportingOption { DoNotReportSecurityError, LogSecurityError, ThrowSecurityError };

namespace BindingSecurity {

template<typename T> T* checkSecurityForNode(JSC::JSGlobalObject&, T&);
template<typename T> T* checkSecurityForNode(JSC::JSGlobalObject&, T*);
template<typename T> ExceptionOr<T*> checkSecurityForNode(JSC::JSGlobalObject&, ExceptionOr<T*>&&);
template<typename T> ExceptionOr<T*> checkSecurityForNode(JSC::JSGlobalObject&, ExceptionOr<T&>&&);

bool shouldAllowAccessToDOMWindow(JSC::JSGlobalObject*, LocalDOMWindow&, SecurityReportingOption = LogSecurityError);
bool shouldAllowAccessToDOMWindow(JSC::JSGlobalObject&, LocalDOMWindow&, String& message);
bool shouldAllowAccessToDOMWindow(JSC::JSGlobalObject*, LocalDOMWindow*, SecurityReportingOption = LogSecurityError);
bool shouldAllowAccessToDOMWindow(JSC::JSGlobalObject&, LocalDOMWindow*, String& message);
bool shouldAllowAccessToDOMWindow(JSC::JSGlobalObject*, DOMWindow&, SecurityReportingOption = LogSecurityError);
bool shouldAllowAccessToDOMWindow(JSC::JSGlobalObject&, DOMWindow&, String& message);
bool shouldAllowAccessToDOMWindow(JSC::JSGlobalObject*, DOMWindow*, SecurityReportingOption = LogSecurityError);
bool shouldAllowAccessToDOMWindow(JSC::JSGlobalObject&, DOMWindow*, String& message);
bool shouldAllowAccessToFrame(JSC::JSGlobalObject*, LocalFrame*, SecurityReportingOption = LogSecurityError);
bool shouldAllowAccessToFrame(JSC::JSGlobalObject&, LocalFrame&, String& message);
bool shouldAllowAccessToNode(JSC::JSGlobalObject&, Node*);

}

template<typename T> inline T* BindingSecurity::checkSecurityForNode(JSC::JSGlobalObject& lexicalGlobalObject, T& node)
{
    return shouldAllowAccessToNode(lexicalGlobalObject, &node) ? &node : nullptr;
}

template<typename T> inline T* BindingSecurity::checkSecurityForNode(JSC::JSGlobalObject& lexicalGlobalObject, T* node)
{
    return shouldAllowAccessToNode(lexicalGlobalObject, node) ? node : nullptr;
}

template<typename T> inline ExceptionOr<T*> BindingSecurity::checkSecurityForNode(JSC::JSGlobalObject& lexicalGlobalObject, ExceptionOr<T*>&& value)
{
    if (value.hasException())
        return value.releaseException();
    return checkSecurityForNode(lexicalGlobalObject, value.releaseReturnValue());
}

template<typename T> inline ExceptionOr<T*> BindingSecurity::checkSecurityForNode(JSC::JSGlobalObject& lexicalGlobalObject, ExceptionOr<T&>&& value)
{
    if (value.hasException())
        return value.releaseException();
    return checkSecurityForNode(lexicalGlobalObject, value.releaseReturnValue());
}

} // namespace WebCore
