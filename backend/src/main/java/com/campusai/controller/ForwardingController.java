package com.campusai.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ForwardingController {

    // Forwards all routes that don't have an extension (like .js, .css) to index.html
    @RequestMapping(value = "/{path:[^\\.]*}")
    public String forward() {
        return "forward:/";
    }
}
