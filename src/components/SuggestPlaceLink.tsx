"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
export default function SuggestPlaceLink(){const[show,setShow]=useState(false);useEffect(()=>{void(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;const{data}=await supabase.rpc("get_my_account_status");const row=Array.isArray(data)?data[0]:data;setShow(row?.account_status==="active")})()},[]);if(!show)return null;return <Link href="/suggest-place">Suggerisci un locale</Link>}
