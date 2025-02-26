/*
 * Copyright (C) 2011-2021 Apple Inc. All rights reserved.
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

#include "CommonSlowPaths.h"
#include "Instruction.h"
#include <wtf/StdLibExtras.h>

namespace JSC {

class CallFrame;
struct ProtoCallFrame;

namespace LLInt {

extern "C" UGPRPair SYSV_ABI llint_trace_operand(CallFrame*, const JSInstruction*, int fromWhere, int operand) REFERENCED_FROM_ASM WTF_INTERNAL;
extern "C" UGPRPair SYSV_ABI llint_trace_value(CallFrame*, const JSInstruction*, int fromWhere, VirtualRegister operand) REFERENCED_FROM_ASM WTF_INTERNAL;
extern "C" UGPRPair SYSV_ABI llint_default_call(CallFrame*, CallLinkInfo*) REFERENCED_FROM_ASM WTF_INTERNAL;
extern "C" UGPRPair SYSV_ABI llint_virtual_call(CallFrame*, CallLinkInfo*) REFERENCED_FROM_ASM WTF_INTERNAL;
extern "C" UGPRPair SYSV_ABI llint_polymorphic_call(CallFrame*, CallLinkInfo*) REFERENCED_FROM_ASM WTF_INTERNAL;
extern "C" void SYSV_ABI llint_write_barrier_slow(CallFrame*, JSCell*) REFERENCED_FROM_ASM WTF_INTERNAL;

#define LLINT_SLOW_PATH_DECL(name) \
    extern "C" UGPRPair SYSV_ABI llint_##name(CallFrame* callFrame, const JSInstruction* pc)

#define LLINT_SLOW_PATH_HIDDEN_DECL(name) \
    LLINT_SLOW_PATH_DECL(name) REFERENCED_FROM_ASM WTF_INTERNAL

LLINT_SLOW_PATH_HIDDEN_DECL(trace_prologue);
LLINT_SLOW_PATH_HIDDEN_DECL(trace_prologue_function_for_call);
LLINT_SLOW_PATH_HIDDEN_DECL(trace_prologue_function_for_construct);
LLINT_SLOW_PATH_HIDDEN_DECL(trace_arityCheck_for_call);
LLINT_SLOW_PATH_HIDDEN_DECL(trace_arityCheck_for_construct);
LLINT_SLOW_PATH_HIDDEN_DECL(trace);
LLINT_SLOW_PATH_HIDDEN_DECL(entry_osr);
LLINT_SLOW_PATH_HIDDEN_DECL(entry_osr_function_for_call);
LLINT_SLOW_PATH_HIDDEN_DECL(entry_osr_function_for_construct);
LLINT_SLOW_PATH_HIDDEN_DECL(entry_osr_function_for_call_arityCheck);
LLINT_SLOW_PATH_HIDDEN_DECL(entry_osr_function_for_construct_arityCheck);
LLINT_SLOW_PATH_HIDDEN_DECL(loop_osr);
LLINT_SLOW_PATH_HIDDEN_DECL(replace);
LLINT_SLOW_PATH_HIDDEN_DECL(stack_check);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_new_object);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_new_array);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_new_array_with_size);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_new_regexp);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_instanceof);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_create_lexical_environment);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_create_direct_arguments);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_create_scoped_arguments);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_create_cloned_arguments);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_try_get_by_id);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_get_by_id_direct);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_get_by_id);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_get_length);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_get_by_id_with_this);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_get_hasInstance_from_instanceof);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_get_prototype_from_instanceof);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_instanceof_from_instanceof);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_put_by_id);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_in_by_id);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_in_by_val);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_has_private_name);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_has_private_brand);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_has_structure_with_flags);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_del_by_id);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_get_by_val);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_get_private_name);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_get_argument_by_val);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_put_by_val);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_put_by_val_direct);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_put_private_name);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_check_private_brand);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_set_private_brand);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_del_by_val);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_put_getter_by_id);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_put_setter_by_id);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_put_getter_setter_by_id);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_put_getter_by_val);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_put_setter_by_val);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_iterator_open_get_next);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_iterator_next_get_done);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_iterator_next_get_value);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jtrue);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jfalse);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_less);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_lesseq);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_greater);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_greatereq);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jless);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jnless);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jgreater);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jngreater);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jlesseq);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jnlesseq);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jgreatereq);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jngreatereq);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jeq);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jneq);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jstricteq);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_jnstricteq);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_switch_imm);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_switch_char);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_switch_string);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_new_func);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_new_func_exp);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_new_generator_func);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_new_generator_func_exp);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_new_async_generator_func);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_new_async_generator_func_exp);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_new_async_func);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_new_async_func_exp);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_set_function_name);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_size_frame_for_varargs);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_size_frame_for_forward_arguments);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_call_varargs);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_tail_call_varargs);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_tail_call_forward_arguments);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_construct_varargs);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_super_construct_varargs);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_call_direct_eval);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_call_direct_eval_wide16);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_call_direct_eval_wide32);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_tear_off_arguments);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_strcat);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_to_primitive);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_throw);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_handle_traps);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_debug);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_handle_exception);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_get_from_scope);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_put_to_scope);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_retrieve_and_clear_exception_if_catchable);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_profile_catch);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_log_shadow_chicken_prologue);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_log_shadow_chicken_tail);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_out_of_line_jump_target);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_arityCheck);
LLINT_SLOW_PATH_HIDDEN_DECL(slow_path_instanceof);
extern "C" UGPRPair SYSV_ABI llint_throw_stack_overflow_error(VM*, ProtoCallFrame*) REFERENCED_FROM_ASM WTF_INTERNAL;
extern "C" UGPRPair SYSV_ABI llint_slow_path_checkpoint_osr_exit(CallFrame* callFrame, EncodedJSValue unused) REFERENCED_FROM_ASM WTF_INTERNAL;
extern "C" UGPRPair SYSV_ABI llint_slow_path_checkpoint_osr_exit_from_inlined_call(CallFrame* callFrame, EncodedJSValue callResult) REFERENCED_FROM_ASM WTF_INTERNAL;
#if ENABLE(C_LOOP)
extern "C" UGPRPair SYSV_ABI llint_stack_check_at_vm_entry(VM*, Register*) REFERENCED_FROM_ASM WTF_INTERNAL;
#endif
extern "C" UGPRPair SYSV_ABI llint_check_vm_entry_permission(VM*, ProtoCallFrame*) REFERENCED_FROM_ASM WTF_INTERNAL;
extern "C" NO_RETURN_DUE_TO_CRASH void SYSV_ABI llint_crash() REFERENCED_FROM_ASM WTF_INTERNAL;

} } // namespace JSC::LLInt
