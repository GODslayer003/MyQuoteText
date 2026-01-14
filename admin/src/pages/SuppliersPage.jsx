import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    Shield,
    AlertTriangle,
    CheckCircle,
    ExternalLink,
    Phone,
    Mail,
    MapPin,
    TrendingDown,
    TrendingUp,
    BarChart3
} from 'lucide-react';
import api from '../services/api';

const SuppliersPage = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/suppliers');
            setSuppliers(response.data.data);
        } catch (err) {
            console.error('Failed to fetch suppliers:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (score) => {
        if (score >= 70) return 'text-red-600 bg-red-50 border-red-100';
        if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-100';
        return 'text-green-600 bg-green-50 border-green-100';
    };

    const filteredSuppliers = suppliers.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.abn && s.abn.includes(searchTerm));
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-8 h-8 text-orange-500" />
                        Supplier Intelligence
                    </h1>
                    <p className="text-gray-600 mt-2">Track contractor history, risk scores, and pricing trends.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">Total Suppliers</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{suppliers.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">High Risk</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                        {suppliers.filter(s => s.intelligence.riskScore >= 70).length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">Quotes Analyzed</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                        {suppliers.reduce((acc, s) => acc + s.intelligence.totalQuotesSeen, 0)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-500 font-medium">Avg Risk Score</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                        {suppliers.length > 0
                            ? Math.round(suppliers.reduce((acc, s) => acc + s.intelligence.riskScore, 0) / suppliers.length)
                            : 0}
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search suppliers by name or ABN..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="px-4 py-2 border border-gray-200 rounded-lg outline-none"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                </select>
            </div>

            {/* Suppliers Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Supplier</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Risk Score</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Quotes Seen</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Pricing</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Contact</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading suppliers...</td>
                            </tr>
                        ) : filteredSuppliers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No suppliers found matching your criteria.</td>
                            </tr>
                        ) : (
                            filteredSuppliers.map((supplier) => (
                                <tr key={supplier._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{supplier.name}</span>
                                            <span className="text-xs text-gray-500">ABN: {supplier.abn || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(supplier.intelligence.riskScore)}`}>
                                            {supplier.intelligence.riskScore >= 70 ? <AlertTriangle className="w-3 h-3" /> :
                                                supplier.intelligence.riskScore >= 40 ? <Shield className="w-3 h-3" /> :
                                                    <CheckCircle className="w-3 h-3" />}
                                            {supplier.intelligence.riskScore}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">{supplier.intelligence.totalQuotesSeen}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            {supplier.intelligence.averagePricing === 'low' ? <TrendingDown className="w-4 h-4 text-green-500" /> :
                                                supplier.intelligence.averagePricing === 'high' ? <TrendingUp className="w-4 h-4 text-red-500" /> :
                                                    <TrendingDown className="w-4 h-4 text-blue-500 transform rotate-45" />}
                                            <span className="text-sm capitalize text-gray-900">{supplier.intelligence.averagePricing}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {supplier.contactInfo.email && <Mail className="w-4 h-4 text-gray-400" />}
                                            {supplier.contactInfo.phone && <Phone className="w-4 h-4 text-gray-400" />}
                                            {supplier.contactInfo.address?.street && <MapPin className="w-4 h-4 text-gray-400" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-orange-600 hover:text-orange-700 font-semibold text-sm">
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SuppliersPage;
