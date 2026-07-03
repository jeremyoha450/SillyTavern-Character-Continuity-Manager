// scripts/ai/registry.js

import {
    getCurrentDriverId
} from "./settings.js";

const drivers = new Map();

export function registerDriver(driver) {

    drivers.set(
        driver.id,
        driver
    );

}

export function getDriver(id) {

    return drivers.get(id);

}

export function getDrivers() {

    return Array.from(
        drivers.values()
    );

}

export function getCurrentDriver() {

    return getDriver(
        getCurrentDriverId()
    );

}