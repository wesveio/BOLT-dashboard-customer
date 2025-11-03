'use client';

import { Card, CardBody, Switch, Select, SelectItem } from '@heroui/react';
import type { ComponentsConfig } from './types';

interface ComponentConfigPanelProps {
  component: keyof ComponentsConfig;
  config: ComponentsConfig[keyof ComponentsConfig];
  onChange: (component: keyof ComponentsConfig, config: ComponentsConfig[keyof ComponentsConfig]) => void;
}

export function ComponentConfigPanel({ component, config, onChange }: ComponentConfigPanelProps) {
  const updateField = (field: string, value: any) => {
    onChange(component, {
      ...config,
      [field]: value,
    });
  };

  if (component === 'orderSummary') {
    const orderSummaryConfig = config as ComponentsConfig['orderSummary'];
    return (
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Order Summary</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Items List</label>
                <p className="text-xs text-gray-500">Display list of cart items</p>
              </div>
              <Switch
                isSelected={orderSummaryConfig.showItemsList}
                onValueChange={(value) => updateField('showItemsList', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Subtotal</label>
                <p className="text-xs text-gray-500">Display subtotal amount</p>
              </div>
              <Switch
                isSelected={orderSummaryConfig.showSubtotal}
                onValueChange={(value) => updateField('showSubtotal', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Shipping</label>
                <p className="text-xs text-gray-500">Display shipping cost</p>
              </div>
              <Switch
                isSelected={orderSummaryConfig.showShipping}
                onValueChange={(value) => updateField('showShipping', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Discount</label>
                <p className="text-xs text-gray-500">Display discount amount</p>
              </div>
              <Switch
                isSelected={orderSummaryConfig.showDiscount}
                onValueChange={(value) => updateField('showDiscount', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Tax</label>
                <p className="text-xs text-gray-500">Display tax amount</p>
              </div>
              <Switch
                isSelected={orderSummaryConfig.showTax}
                onValueChange={(value) => updateField('showTax', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Total</label>
                <p className="text-xs text-gray-500">Display total amount</p>
              </div>
              <Switch
                isSelected={orderSummaryConfig.showTotal}
                onValueChange={(value) => updateField('showTotal', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Coupon Field</label>
                <p className="text-xs text-gray-500">Display coupon code input</p>
              </div>
              <Switch
                isSelected={orderSummaryConfig.showCouponField}
                onValueChange={(value) => updateField('showCouponField', value)}
                size="sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Sticky Behavior</label>
              <Select
                selectedKeys={[orderSummaryConfig.stickyBehavior]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateField('stickyBehavior', selected);
                }}
                variant="bordered"
                size="lg"
              >
                <SelectItem key="none" textValue="none">None</SelectItem>
                <SelectItem key="top" textValue="top">Sticky Top</SelectItem>
                <SelectItem key="sidebar" textValue="sidebar">Sticky Sidebar</SelectItem>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (component === 'payment') {
    const paymentConfig = config as ComponentsConfig['payment'];
    return (
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Payment Component</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Card Icons</label>
                <p className="text-xs text-gray-500">Display credit card icons</p>
              </div>
              <Switch
                isSelected={paymentConfig.showCardIcons}
                onValueChange={(value) => updateField('showCardIcons', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Installments</label>
                <p className="text-xs text-gray-500">Display installment options</p>
              </div>
              <Switch
                isSelected={paymentConfig.showInstallments}
                onValueChange={(value) => updateField('showInstallments', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Save Card Option</label>
                <p className="text-xs text-gray-500">Allow saving card for future use</p>
              </div>
              <Switch
                isSelected={paymentConfig.showSaveCardOption}
                onValueChange={(value) => updateField('showSaveCardOption', value)}
                size="sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Card Number Format</label>
              <Select
                selectedKeys={[paymentConfig.cardNumberFormat]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateField('cardNumberFormat', selected);
                }}
                variant="bordered"
                size="lg"
              >
                <SelectItem key="spaced" textValue="spaced">Spaced (1234 5678)</SelectItem>
                <SelectItem key="dashed" textValue="dashed">Dashed (1234-5678)</SelectItem>
                <SelectItem key="none" textValue="none">None (12345678)</SelectItem>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Expiry Format</label>
              <Select
                selectedKeys={[paymentConfig.expiryFormat]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateField('expiryFormat', selected);
                }}
                variant="bordered"
                size="lg"
              >
                <SelectItem key="MM/YY" textValue="MM/YY">MM/YY</SelectItem>
                <SelectItem key="MM-YY" textValue="MM-YY">MM-YY</SelectItem>
                <SelectItem key="MM YY" textValue="MM YY">MM YY</SelectItem>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">CVV Required</label>
                <p className="text-xs text-gray-500">Require CVV verification</p>
              </div>
              <Switch
                isSelected={paymentConfig.cvvRequired}
                onValueChange={(value) => updateField('cvvRequired', value)}
                size="sm"
              />
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (component === 'cart') {
    const cartConfig = config as ComponentsConfig['cart'];
    return (
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Cart Step</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Images</label>
                <p className="text-xs text-gray-500">Display product images</p>
              </div>
              <Switch
                isSelected={cartConfig.showImages}
                onValueChange={(value) => updateField('showImages', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Quantity Controls</label>
                <p className="text-xs text-gray-500">Allow quantity adjustment</p>
              </div>
              <Switch
                isSelected={cartConfig.showQuantityControls}
                onValueChange={(value) => updateField('showQuantityControls', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Remove Button</label>
                <p className="text-xs text-gray-500">Allow item removal</p>
              </div>
              <Switch
                isSelected={cartConfig.showRemoveButton}
                onValueChange={(value) => updateField('showRemoveButton', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Discount Badge</label>
                <p className="text-xs text-gray-500">Display discount indicators</p>
              </div>
              <Switch
                isSelected={cartConfig.showDiscountBadge}
                onValueChange={(value) => updateField('showDiscountBadge', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Undeliverable Warning</label>
                <p className="text-xs text-gray-500">Display delivery warnings</p>
              </div>
              <Switch
                isSelected={cartConfig.showUndeliverableWarning}
                onValueChange={(value) => updateField('showUndeliverableWarning', value)}
                size="sm"
              />
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (component === 'shipping') {
    const shippingConfig = config as ComponentsConfig['shipping'];
    return (
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Shipping Step</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Postal Code Lookup</label>
                <p className="text-xs text-gray-500">Enable CEP/zip code lookup</p>
              </div>
              <Switch
                isSelected={shippingConfig.showPostalCodeLookup}
                onValueChange={(value) => updateField('showPostalCodeLookup', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Address Fields</label>
                <p className="text-xs text-gray-500">Display address input fields</p>
              </div>
              <Switch
                isSelected={shippingConfig.showAddressFields}
                onValueChange={(value) => updateField('showAddressFields', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Delivery Options</label>
                <p className="text-xs text-gray-500">Display shipping method options</p>
              </div>
              <Switch
                isSelected={shippingConfig.showDeliveryOptions}
                onValueChange={(value) => updateField('showDeliveryOptions', value)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Delivery Estimate</label>
                <p className="text-xs text-gray-500">Display estimated delivery time</p>
              </div>
              <Switch
                isSelected={shippingConfig.showDeliveryEstimate}
                onValueChange={(value) => updateField('showDeliveryEstimate', value)}
                size="sm"
              />
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return null;
}

