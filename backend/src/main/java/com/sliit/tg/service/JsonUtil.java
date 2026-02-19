package com.sliit.tg.service;

import java.util.ArrayList;
import java.util.List;

public final class JsonUtil {
    private JsonUtil(){}

    public static String toJsonArray(List<String> items){
        StringBuilder sb = new StringBuilder("[");
        for (int i=0;i<items.size();i++){
            sb.append("\"").append(escape(items.get(i))).append("\"");
            if (i<items.size()-1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    public static List<String> parseJsonArray(String json){
        List<String> out = new ArrayList<>();
        if (json == null) return out;
        String s = json.trim();
        if (!s.startsWith("[") || !s.endsWith("]")) return out;
        s = s.substring(1, s.length()-1).trim();
        if (s.isEmpty()) return out;

        String[] parts = s.split("\",\"");
        for (int i=0;i<parts.length;i++){
            String p = parts[i];
            if (i==0 && p.startsWith("\"")) p = p.substring(1);
            if (i==parts.length-1 && p.endsWith("\"")) p = p.substring(0, p.length()-1);
            out.add(unescape(p));
        }
        return out;
    }

    private static String escape(String s){ return s.replace("\\", "\\\\").replace("\"", "\\\""); }
    private static String unescape(String s){ return s.replace("\\\"", "\"").replace("\\\\", "\\"); }
}