import { Button, Col, Form, Input, message, Row, Select } from 'antd';
import { push } from 'connected-react-router';
import { map } from 'lodash';
import React, { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { connectFanpageApi } from '../../api/fanpage';
import locationApi from '../../api/location-api';
import storeApi from '../../api/store-api';
import { Loading } from '../../components';
import useHiddenModalExpired from '../../hooks/use-hidden-modal-expired';
import { IAuthState } from '../../reducers/authState/authReducer';
import { loadFanpageAction } from '../../reducers/fanpageState/fanpageAction';
import types from '../../reducers/fanpageState/fanpageTypes';
import { addStore, updateStore } from '../../reducers/storeState/storeAction';
import { disabledAutosuggestion } from '../../utils/disabled-autosuggestion';

const size = 'large';
const style = { width: '100%' };

export interface Province {
    code: string;
    name: string;
    name_with_type: string;
    slug: string;
    type: string;
}

export interface District {
    code: string;
    name: string;
    name_with_type: string;
    parent_code: string;
    path: string;
    path_with_type: string;
    slug: string;
    type: string;
}
export interface Ward {
    code: string;
    name: string;
    name_with_type: string;
    parent_code: string;
    path: string;
    path_with_type: string;
    slug: string;
    type: string;
}

interface Props {
    toggleLoading?: (boolean: boolean) => void;
}

const CreateStoreForm: FC<Props> = ({ toggleLoading = () => {} }): JSX.Element => {
    const loadingStore = useSelector((state: any) => state.store.loading);
    const [loadingConnect, setLoadingConnect] = useState(false);
    const store = useSelector((state: any) => state.store.store);

    const [form] = Form.useForm();

    const [provinceId, setProvinceId] = useState<string | undefined>(
        store ? `${store.province}` : undefined,
    );
    const [provinces, setProvinces] = useState<Province[]>([]);

    const [districtId, setDistrictId] = useState<string | undefined>(
        store ? `${store.district}` : undefined,
    );
    const [districts, setDistricts] = useState<District[]>([]);

    const [wards, setWards] = useState<District[]>([]);

    const [loading, setLoading] = useState<boolean>(false);
    const [loadingProvince, setLoadingProvince] = useState<boolean>(true);
    const [loadingDistrict, setLoadingDistrict] = useState<boolean>(false);
    const [loadingWard, setLoadingWard] = useState<boolean>(false);
    const dispatch = useDispatch();
    const token: any = useSelector(({ auth }: { auth: IAuthState }) => auth.token);
    const { hiddenModalExpired } = useHiddenModalExpired();

    const addNewStore = async (values: any) => {
        try {
            toggleLoading(true);
            const resCreateStore = await storeApi.createStore({
                token: token.accessToken,
                name: values.name,
                address: values.address,
                province: values.province,
                district: values.district,
                ward: values.ward,
                phoneNo: values.phoneNo,
            });

            dispatch(addStore({ ...resCreateStore, role: 0 }));

            const shortLiveToken = localStorage.getItem('shortLiveToken');

            if (shortLiveToken) {
                try {
                    const resConnectFanpage = await connectFanpageApi({
                        payload: { shortLiveToken },
                        storeId: resCreateStore._id,
                        token: token.accessToken,
                    });
                    dispatch({
                        type: types.CONNECT_FANPAGE_SUCCESSS,
                        payload: resConnectFanpage.data,
                    });

                    dispatch(loadFanpageAction());
                    localStorage.removeItem('shortLiveToken');
                    setLoading(false);
                    dispatch(push('/customer'));
                    message.success('???? t???o xong c???a h??ng');
                    setLoadingConnect(false);
                } catch (e) {
                    toggleLoading(false);
                    dispatch({
                        type: types.CONNECT_FANPAGE_FAILED,
                    });
                }
            } else {
                dispatch(loadFanpageAction());
                setLoading(false);
                dispatch(push('/customer'));
                message.success('???? t???o xong c???a h??ng');
                setLoadingConnect(false);
            }
            toggleLoading(false);
        } catch (error) {
            setLoading(false);
        }
    };

    const editStore = async (values: any) => {
        try {
            const response = await storeApi.editStore({
                storeId: store._id,
                token: token.accessToken,
                data: values,
            });

            dispatch(updateStore(response));
            setLoading(false);
            message.success('???? c???p nh???t c???a h??ng');
        } catch (error) {
            setLoading(false);
            message.error('L???i c???p nh???t c???a h??ng');
        }
    };

    const onFinish = async (values: any) => {
        setLoading(true);

        if (store && store) {
            editStore(values);
        } else {
            addNewStore(values);
        }
    };

    const validatePhone = (_: any, value: any, callback: any) => {
        if (value) {
            const vnf_regex = /^(0|\+84)(9|3|7|8|5){1}([0-9]{8})$/g;
            if (vnf_regex.test(value) === false) {
                callback('Vui l??ng nh???p s??? ??i???n tho???i h???p l???');
            } else {
                callback();
            }
        } else {
            callback();
        }
    };

    const selectProvince = (value: any) => {
        setProvinceId(value);
        setDistrictId(undefined);

        form.setFieldsValue({
            district: undefined,
            ward: undefined,
        });
    };

    const selectDistrict = (value: any) => {
        setDistrictId(value);
        setWards([]);
        form.setFieldsValue({
            ward: undefined,
        });
    };

    useEffect(() => {
        if (store) {
            setProvinceId(`${store.province}`);
            setDistrictId(`${store.district}`);
        }
    }, [store]);

    useEffect(() => {
        const fixAutocomplete = () => {
            document.querySelectorAll('.ant-select-selector input').forEach((e) => {
                e.setAttribute('autocomplete', 'stopDamnAutocomplete');
            });
        };

        fixAutocomplete();
    }, []);

    useEffect(() => {
        const initialValues = {
            province: '-1',
            district: '-1',
            ward: '-1',
        };

        if (store) {
            form.setFieldsValue(store);
        } else {
            form.setFieldsValue(initialValues);
        }
    }, []);

    useEffect(() => {
        async function getListProvinces() {
            try {
                const response = await locationApi.getProvinces();
                setProvinces(response);
                setLoadingProvince(false);
            } catch (error) {
                setProvinces([]);
                setLoadingProvince(false);
            }
        }
        getListProvinces();
    }, []);

    useEffect(() => {
        async function getListDistricts() {
            if (!provinceId) return null;
            setLoadingDistrict(true);
            try {
                const response = await locationApi.getDistricts(provinceId);
                setDistricts(response);
                setLoadingDistrict(false);
            } catch (error) {
                setDistricts([]);
                setLoadingDistrict(false);
            }
        }
        getListDistricts();
    }, [provinceId]);

    useEffect(() => {
        async function getListWard() {
            if (!districtId) return null;
            setLoadingWard(true);
            try {
                const response = await locationApi.getWards({
                    provinceId,
                    districtId,
                });
                setWards(response);
                setLoadingWard(false);
            } catch (error) {
                setWards([]);
                setLoadingWard(false);
            }
        }
        getListWard();
    }, [districtId]);

    if (loadingStore) return <Loading full />;

    const initialValues = {
        name: store ? store.name : '',
        phoneNo: store ? store.phoneNo : '',
        province: store ? `${store.province}` : '',
        district: store ? `${store.district}` : '',
        ward: store ? `${store.ward}` : '',
        address: store ? store.address : '',
    };

    if (loadingConnect) {
        return <Loading full />;
    }

    return (
        <Form layout='vertical' form={form} onFinish={onFinish} initialValues={initialValues}>
            <Form.Item
                name='name'
                label='T??n c???a h??ng'
                rules={[{ required: true, message: '??i???n t??n c???a h??ng' }]}
            >
                <Input size={size} placeholder='T??n c???a h??ng' autoFocus />
            </Form.Item>

            <Form.Item
                name='phoneNo'
                label='S??? ??i???n tho???i'
                rules={[
                    { required: true, message: '??i???n s??? ??i???n tho???i' },
                    {
                        validator: validatePhone,
                    },
                ]}
            >
                <Input style={style} size={size} placeholder='S??? ??i???n tho???i c???a h??ng' />
            </Form.Item>

            <Row gutter={15}>
                <Col md={8}>
                    <Form.Item
                        name='province'
                        label='T???nh/th??nh ph???'
                        rules={[
                            {
                                required: true,
                                message: 'Ch???n t???nh/th??nh ph???',
                            },
                        ]}
                    >
                        <Select
                            size={size}
                            placeholder='Ch???n t???nh/th??nh ph???'
                            onChange={selectProvince}
                            showSearch
                            filterOption={(input, option: any) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                            loading={loadingProvince}
                            onFocus={disabledAutosuggestion}
                        >
                            <Select.Option value={'-1'} key={'-1'} disabled>
                                Ch???n t???nh/th??nh ph???
                            </Select.Option>
                            {map(provinces, (province: Province) => (
                                <Select.Option value={province.code} key={province.code}>
                                    {province.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>

                <Col md={8}>
                    <Form.Item
                        name='district'
                        label='Qu???n/huy???n'
                        rules={[{ required: true, message: 'Ch???n qu???n/huy???n' }]}
                    >
                        <Select
                            size={size}
                            placeholder='Ch???n qu???n/huy???n'
                            onChange={selectDistrict}
                            showSearch
                            filterOption={(input, option: any) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                            value={districtId}
                            disabled={!provinceId}
                            loading={loadingDistrict}
                            onFocus={disabledAutosuggestion}
                        >
                            <Select.Option value={'-1'} key={'-1'} disabled>
                                Ch???n qu???n/huy???n
                            </Select.Option>
                            {map(districts, (district: District) => (
                                <Select.Option value={district.code} key={district.code}>
                                    {district.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>

                <Col md={8}>
                    <Form.Item
                        name='ward'
                        label='X??/ph?????ng'
                        rules={[{ required: true, message: 'Ch???n x??/ph?????ng' }]}
                    >
                        <Select
                            size={size}
                            placeholder='Ch???n x??/ph?????ng'
                            showSearch
                            filterOption={(input, option: any) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                            disabled={!districtId}
                            loading={loadingWard}
                            onFocus={disabledAutosuggestion}
                        >
                            <Select.Option value={'-1'} key={'-1'} disabled>
                                Ch???n x??/ph?????ng
                            </Select.Option>
                            {map(wards, (ward: Ward) => {
                                return (
                                    <Select.Option value={ward.code} key={ward.code}>
                                        {ward.name}
                                    </Select.Option>
                                );
                            })}
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                name='address'
                rules={[{ required: true, message: '??i???n ?????a ch??? c???a h??ng' }]}
                label='?????a ch???'
            >
                <Input.TextArea
                    autoComplete='off'
                    placeholder='??i???n ?????a ch??? c???a h??ng'
                    rows={4}
                ></Input.TextArea>
            </Form.Item>

            <Form.Item>
                <Button
                    type='primary'
                    size={size}
                    htmlType='submit'
                    block
                    loading={loading}
                    disabled={
                        hiddenModalExpired || (store ? (store.role !== 0 ? true : false) : false)
                    }
                >
                    {store && store ? 'C???p nh???t c???a h??ng' : 'T???o c???a h??ng'}
                </Button>
            </Form.Item>
        </Form>
    );
};

export default CreateStoreForm;
