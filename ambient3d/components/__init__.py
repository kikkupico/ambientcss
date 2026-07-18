"""Component package. `set_value` re-poses any built component by its
stored `skeuo_type` — state is pure object transforms, so this works on
freshly built objects and on objects loaded from a saved .blend alike.

Component roots may be base tiles with the stateful part as a child (e.g. a
knob on a tile), so the dispatcher searches descendants when the root
itself carries no state.
"""


def _find_stateful(obj, handlers):
    if obj.get("skeuo_type") in handlers:
        return obj
    for child in obj.children:
        found = _find_stateful(child, handlers)
        if found is not None:
            return found
    return None


def set_value(obj, value):
    from components import button, fader, knob

    handlers = {"knob": knob, "button": button, "fader": fader}
    target = _find_stateful(obj, handlers)
    if target is None:
        raise ValueError(f"{obj.name} has no skeuo state in its hierarchy")
    return handlers[target["skeuo_type"]].set_value(target, value)
