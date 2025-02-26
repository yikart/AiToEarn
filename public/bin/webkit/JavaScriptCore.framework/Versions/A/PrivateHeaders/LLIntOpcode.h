/*
 * Copyright (C) 2012-2023 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#if ENABLE(C_LOOP)

#define FOR_EACH_LLINT_NOJIT_NATIVE_HELPER(macro) \
    FOR_EACH_CLOOP_BYTECODE_HELPER_ID(macro)

#define FOR_EACH_LLINT_NOJIT_RETURN_HELPER(macro) \
    FOR_EACH_CLOOP_RETURN_HELPER_ID(macro)

#else // !ENABLE(C_LOOP)

#define FOR_EACH_LLINT_NOJIT_NATIVE_HELPER(macro) \
    // Nothing to do here. Use the LLInt ASM / JIT impl instead.

#define FOR_EACH_LLINT_NOJIT_RETURN_HELPER(macro) \
    // Nothing to do here. Use the LLInt ASM / JIT impl instead.

#endif // ENABLE(C_LOOP)


#define FOR_EACH_LLINT_NATIVE_HELPER(macro) \
    FOR_EACH_LLINT_NOJIT_NATIVE_HELPER(macro) \
    FOR_EACH_LLINT_NOJIT_RETURN_HELPER(macro)

#define FOR_EACH_LLINT_OPCODE_EXTENSION(macro) \
    FOR_EACH_BYTECODE_HELPER_ID(macro) \
    FOR_EACH_LLINT_NATIVE_HELPER(macro)


#define FOR_EACH_LLINT_OPCODE_WITH_RETURN(macro) \
    macro(op_call) \
    macro(op_call_ignore_result) \
    macro(op_iterator_open) \
    macro(op_iterator_next) \
    macro(op_construct) \
    macro(op_super_construct) \
    macro(op_call_varargs) \
    macro(op_construct_varargs) \
    macro(op_super_construct_varargs) \
    macro(op_get_by_id) \
    macro(op_get_by_id_direct) \
    macro(op_get_length) \
    macro(op_get_by_val) \
    macro(op_put_by_id) \
    macro(op_put_by_val) \
    macro(op_put_by_val_direct) \
    macro(op_in_by_id) \
    macro(op_in_by_val) \
    macro(op_enumerator_get_by_val) \
    macro(op_enumerator_put_by_val) \
    macro(op_enumerator_in_by_val) \

